import "https://deno.land/x/xhr@0.4.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DirectGoal = {
  concept_id: string;
  goal_description: string;
  bloom_level?: string | null;
  goal_type?: string | null;
  sequence_order?: number | null;
  approved?: boolean | string | null;
};

type EnrichRequest =
  | { concept_id: string; goals_text: string; approved?: boolean }
  | { goals: DirectGoal[] };

type EnrichedGoal = {
  goal_description: string;
  bloom_level: string;
  goal_type: "Knowledge" | "Performance";
  sequence_order: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  try {
    const { data: userResult, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const role = (userResult.user.app_metadata as any)?.role || (userResult.user.user_metadata as any)?.role;
    if (role !== "admin" && role !== "teacher") {
      return new Response(JSON.stringify({ error: "Forbidden: Requires admin or teacher role" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as EnrichRequest;

    // Helpers: normalization and similarity
    const normalize = (s: string) =>
      s.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[\r\n]+/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

    const levenshtein = (a: string, b: string) => {
      const m = a.length, n = b.length;
      if (m === 0) return n; if (n === 0) return m;
      const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
      }
      return dp[m][n];
    };
    const similarity = (s1: string, s2: string) => {
      const a = normalize(s1), b = normalize(s2);
      const dist = levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length) || 1;
      return 1 - dist / maxLen;
    };
    const SIM_THRESHOLD = 0.9;

    // Direct mode: bulk insert without AI enrichment
    if ((body as any)?.goals && Array.isArray((body as any).goals)) {
      const goals = ((body as any).goals as DirectGoal[]).filter(g => g && g.goal_description && g.concept_id);
      if (!goals.length) {
        return new Response(JSON.stringify({ error: "No valid goals provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For teachers, validate they own all referenced concepts
      const conceptIds = Array.from(new Set(goals.map(g => g.concept_id)));
      if (role === "teacher") {
        const { data: concepts, error: cErr } = await supabase.from("concepts").select("id, created_by").in("id", conceptIds);
        if (cErr) {
          return new Response(JSON.stringify({ error: "Concept lookup failed", details: cErr.message }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const unauthorized = (concepts || []).some(c => c.created_by && c.created_by !== userResult.user.id);
        if (unauthorized) {
          return new Response(JSON.stringify({ error: "Forbidden: You don't own one or more concepts" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Fetch approved existing per concept for dedupe
      const byConcept: Record<string, string[]> = {};
      for (const cid of conceptIds) {
        const { data } = await supabase.from("learning_goals").select("goal_description").eq("concept_id", cid).eq("status", "approved");
        byConcept[cid] = (data || []).map(r => r.goal_description || "").filter(Boolean);
      }

      const rows: any[] = [];
      const skipped: any[] = [];
      for (const g of goals) {
        const status = (g.approved === undefined || g.approved === null || String(g.approved).toLowerCase() === "yes" || g.approved === true) ? "approved" : "suggested";
        const existing = byConcept[g.concept_id] || [];
        const isDup = existing.some(e => similarity(e, g.goal_description) >= SIM_THRESHOLD);
        if (isDup) {
          skipped.push({ concept_id: g.concept_id, goal_description: g.goal_description });
          continue;
        }
        rows.push({
          concept_id: g.concept_id,
          goal_description: g.goal_description.trim(),
          bloom_level: g.bloom_level ?? null,
          goal_type: g.goal_type ?? null,
          sequence_order: typeof g.sequence_order === "number" ? g.sequence_order : null,
          status,
          metadata: { source: "bulk_upload" },
        });
      }

      if (rows.length) {
        const { error: insErr } = await supabaseAdmin.from("learning_goals").insert(rows);
        if (insErr) {
          return new Response(JSON.stringify({ error: "Failed to insert learning goals", details: insErr.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, inserted: rows.length, skipped_duplicates: skipped.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrichment mode
    const { concept_id, goals_text } = body as any;
    if (!concept_id || !goals_text) {
      return new Response(JSON.stringify({ error: "Missing concept_id or goals_text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate concept ownership for teachers
    const { data: concept, error: conceptErr } = await supabase
      .from("concepts")
      .select("id, created_by, domain_id")
      .eq("id", concept_id)
      .maybeSingle();
    if (conceptErr || !concept) {
      return new Response(JSON.stringify({ error: "Concept not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (role === "teacher" && concept.created_by && concept.created_by !== userResult.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: You don't own this concept" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines = String(goals_text).split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    if (!lines.length) {
      return new Response(JSON.stringify({ error: "No learning goals provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY secret in project." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an expert instructional designer. For each learning goal below, return a JSON array where each item has: goal_description (string), bloom_level (one of Remember, Understand, Apply, Analyze, Evaluate, Create), goal_type (Knowledge or Performance), sequence_order (1..N in logical progression). Only return pure JSON.\n\nLearning goals:\n${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;

    // --- LOG FINAL PROMPT BEFORE GEMINI CALL ---
    console.log("--- FINAL PROMPT SENT TO GEMINI ---");
    console.log("System Prompt:", "(none)");
    console.log("User Prompt:", prompt);
    console.log("------------------------------------");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      },
    );

    if (!geminiRes.ok) {
      const txt = await geminiRes.text();
      return new Response(JSON.stringify({ error: "Gemini request failed", details: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiJson = await geminiRes.json();
    const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let enriched: EnrichedGoal[] = [];
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      enriched = parsed.map((g: any, idx: number) => ({
        goal_description: String(g.goal_description ?? lines[idx] ?? "").trim(),
        bloom_level: String(g.bloom_level ?? "Understand").trim(),
        goal_type: (String(g.goal_type ?? "Knowledge").trim() === "Performance" ? "Performance" : "Knowledge"),
        sequence_order: Number.isFinite(Number(g.sequence_order)) ? Number(g.sequence_order) : idx + 1,
      }));
    } catch (_) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: text }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Dedupe against approved existing for this concept
    const { data: approvedExisting } = await supabase
      .from("learning_goals")
      .select("goal_description")
      .eq("concept_id", concept_id)
      .eq("status", "approved");
    const existingTexts = (approvedExisting || []).map(r => r.goal_description || "").filter(Boolean);

    const rows = [];
    const status = ((body as any)?.approved === true) ? "approved" : "suggested";
    for (const e of enriched) {
      const isDup = existingTexts.some(t => similarity(t, e.goal_description) >= SIM_THRESHOLD);
      if (isDup) continue;
      rows.push({
        concept_id,
        goal_description: e.goal_description,
        bloom_level: e.bloom_level,
        goal_type: e.goal_type,
        sequence_order: e.sequence_order,
        status,
        metadata: { source: "manual_enrich" },
      });
    }

    if (rows.length) {
      const { error: insertErr } = await supabaseAdmin.from("learning_goals").insert(rows as any);
      if (insertErr) {
        return new Response(JSON.stringify({ error: "Failed to insert learning goals", details: insertErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, inserted: rows.length, skipped_duplicates: enriched.length - rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("enrich-and-save-learning-goals error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});