
/* @ts-nocheck */
// Supabase Edge Function: trigger-learning-goal-generation
// - Validates authenticated admin or teacher assigned to the domain
// - Publishes a Pub/Sub message for each concept_id with { concept_id, domain_slug }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@4.14.4";

// CORS headers for browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  concept_ids: string[];
  domain_slug: string;
  strict_mimicry?: boolean;
  force_local?: boolean;
  location?: string;
  mode?: 'strict' | 'bootstrap';
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GOOGLE_SA_JSON = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT") || "";
// OpenAI fallback removed; focusing on Vertex AI only.

// Acquire OAuth token using a service account via JWT Bearer flow
async function getGoogleAccessTokenFromServiceAccount(scope: string): Promise<string> {
  if (!GOOGLE_SA_JSON) {
    throw new Error("Missing GOOGLE_CLOUD_SERVICE_ACCOUNT secret");
  }

  const sa = JSON.parse(GOOGLE_SA_JSON);
  const privateKey = sa.private_key as string;
  const clientEmail = sa.client_email as string;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Sign JWT with RS256
  const alg = "RS256";
  const key = await importPKCS8(privateKey, alg);
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  // Exchange for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Failed to get Google access token:", err);
    throw new Error("Failed to get Google access token");
  }

  const tokenJson = await tokenRes.json();
  return tokenJson.access_token as string;
}

async function publishToPubSub(topic: string, message: unknown, accessToken: string, projectId: string) {
  const url = `https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${topic}:publish`;

  const dataBuffer = new TextEncoder().encode(JSON.stringify(message));
  const base64Data = btoa(String.fromCharCode(...dataBuffer));

  const body = {
    messages: [{ data: base64Data }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Pub/Sub publish failed:", txt);
    throw new Error(`Pub/Sub publish failed: ${txt}`);
  }

  const json = await res.json();
  return json;
}

async function generateGoalsFallback(supabase: any, conceptId: string, domain_slug: string, locationOverride?: string): Promise<number> {
  try {
    // Strict mimicry thresholds
    const STYLE_MIN = 0.82;
    const DUP_MAX = 0.92;

    const sa = JSON.parse(GOOGLE_SA_JSON || "{}");
    const projectId = sa.project_id as string;
    const location = locationOverride || (sa.location as string) || 'us-central1';
    if (!projectId) {
      console.warn('Missing project_id in GOOGLE_CLOUD_SERVICE_ACCOUNT');
      return 0;
    }

    const accessToken = await getGoogleAccessTokenFromServiceAccount("https://www.googleapis.com/auth/cloud-platform");
    const genUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;
    console.log('Vertex model endpoint (strict):', genUrl);
    const embUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/textembedding-gecko@003:predict`;

    // Helpers
    const embed = async (text: string): Promise<number[] | null> => {
      // NOTE: Using the 'predict' endpoint for stability.
      const embUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004:predict`;

      const body = {
        instances: [
          {
            content: text
          }
        ]
      };

      try {
        const r = await fetch(embUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const responseText = await r.text();
          console.error(`Vertex AI request failed with status: ${r.status}`);
          console.error(`Vertex AI raw response: ${responseText}`);
          return null;
        }

        const j = await r.json();
        const vec = j?.predictions?.[0]?.embeddings?.values;
        return Array.isArray(vec) ? vec : null;
      } catch (e) {
        console.warn('Embed call failed', e);
        return null;
      }
    };
    const cosine = (a: number[], b: number[]) => {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
    };

    // Concept details
    const { data: concept, error: conceptErr } = await supabase
      .from('concepts')
      .select('id, name, description, parent_concept_id, domain_id')
      .eq('id', conceptId)
      .maybeSingle();
    if (conceptErr || !concept) {
      console.warn('Concept lookup failed for strict generation:', conceptErr);
      return 0;
    }

    // Reference set: approved goals from this concept, parent, and siblings
    const refs: Array<{ id: string; text: string }> = [];
    const { data: approvedSelf } = await supabase
      .from('learning_goals')
      .select('id, goal_description')
      .eq('concept_id', conceptId)
      .eq('status', 'approved');
    (approvedSelf || []).forEach((r: any) => { if (r.goal_description) refs.push({ id: r.id, text: r.goal_description }); });

    if (concept.parent_concept_id) {
      const { data: approvedParent } = await supabase
        .from('learning_goals')
        .select('id, goal_description')
        .eq('concept_id', concept.parent_concept_id)
        .eq('status', 'approved');
      (approvedParent || []).forEach((r: any) => { if (r.goal_description) refs.push({ id: r.id, text: r.goal_description }); });

      const { data: siblingIds } = await supabase
        .from('concepts')
        .select('id')
        .eq('parent_concept_id', concept.parent_concept_id)
        .neq('id', conceptId);
      const sids = (siblingIds || []).map((s: any) => s.id);
      if (sids.length) {
        const { data: approvedSiblings } = await supabase
          .from('learning_goals')
          .select('id, goal_description')
          .in('concept_id', sids)
          .eq('status', 'approved');
        (approvedSiblings || []).forEach((r: any) => { if (r.goal_description) refs.push({ id: r.id, text: r.goal_description }); });
      }
    }

    if (refs.length === 0) {
      console.warn('No approved goals available as style references; switching to bootstrap generation');
      return await generateGoalsBootstrap(supabase, conceptId, domain_slug, locationOverride);
    }

    // Build few-shot styled prompt
    const examples = refs.slice(0, 6).map(r => `- ${r.text}`).join('\n');
    const prompt = `You are an expert pedagogy assistant. Generate 3-5 concise learning goals for the concept below.\n\n` +
      `STRICT OUTPUT: Return ONLY valid JSON: {"goals":[{"description":string,"bloom_level":string|null,"goal_type":string|null}]}. No extra text.\n` +
      `STYLE: Mimic the tone, structure, and specificity of these approved examples. Avoid duplicates and near-duplicates.\n\n` +
      `Domain: ${domain_slug}\nConcept: ${concept.name}\nDescription: ${concept.description || ''}\n\n` +
      `Approved examples (style to mimic):\n${examples}\n` +
      `Rules:\n- Student-centered, action-oriented.\n- Keep 1 sentence each (max ~20 words).\n- Prefer verbs aligned with Bloom's level if set.\n- Vary semantics while matching style.\n- Do not repeat examples.`;

    // Log prompt preview for diagnostics (truncated)
    const promptPreview = prompt.slice(0, 3000);
    console.log('LLM Prompt (strict)', { concept_id: conceptId, domain_slug, location, length: prompt.length, preview: promptPreview });

    // Generate candidates via Gemini
    const genRes = await fetch(genUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.2 },
      }),
    });
    let goals: Array<{ description: string; bloom_level?: string | null; goal_type?: string | null }> = [];
    if (genRes.ok) {
      const genJson = await genRes.json();
      const text = genJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const parsed = JSON.parse(text);
        goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
      } catch (_) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { const parsed = JSON.parse(match[0]); goals = Array.isArray(parsed?.goals) ? parsed.goals : []; } catch {}
        }
      }
    } else {
      console.error(`Vertex AI request failed with status: ${genRes.status}`, { url: genUrl });
      const t = await genRes.text();
      console.error('Gemini generation failed:', t);

      // Try alternative models/regions on NOT_FOUND
      const triedCombos: string[] = [];
      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
      const candidateRegions = Array.from(new Set([location, 'europe-west4'].filter(Boolean)));

      for (const reg of candidateRegions) {
        for (const mdl of candidateModels) {
          const combo = `${reg}:${mdl}`;
          if (triedCombos.includes(combo)) continue;
          triedCombos.push(combo);

          // Skip the exact combo we already attempted first
          if (reg === location && mdl === 'gemini-2.5-flash') continue;

          try {
            const retryUrl = `https://${reg}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${reg}/publishers/google/models/${mdl}:generateContent`;
            console.log('Retrying Vertex AI', { region: reg, model: mdl, url: retryUrl });
            const r = await fetch(retryUrl, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }]}],
                generationConfig: { temperature: 0.2 },
              }),
            });
            if (!r.ok) {
              console.error(`Vertex AI request failed with status: ${r.status}`, { region: reg, model: mdl, url: retryUrl });
              const txt = await r.text();
              console.error('Gemini generation retry failed:', txt);
              continue;
            }
            const jj = await r.json();
            const tx = jj?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            try {
              const parsed = JSON.parse(tx);
              goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
            } catch (_) {
              const match = tx.match(/\{[\s\S]*\}/);
              if (match) {
                try { const parsed2 = JSON.parse(match[0]); goals = Array.isArray(parsed2?.goals) ? parsed2.goals : []; } catch {}
              }
            }
            if (goals.length) break;
          } catch (re) {
            console.error('Gemini retry error:', re);
          }
        }
        if (goals.length) break;
      }
      // goals remains [] if still failing after fallbacks
    }
    console.log('Parsed candidates (strict):', goals.length);
    if (!goals.length) return 0;

    // Existing goals for duplicate check
    const { data: existing } = await supabase
      .from('learning_goals')
      .select('id, goal_description, status')
      .eq('concept_id', conceptId)
      .eq('status', 'approved');
    const existingTexts = (existing || []).map((e: any) => e.goal_description).filter(Boolean);

    // Prepare embeddings for refs and existing
    const refEmbeds: Array<{ id: string; v: number[]; text: string }> = [];
    for (const r of refs) {
      const v = await embed(r.text);
      if (v) refEmbeds.push({ id: r.id, v, text: r.text });
    }
    const existingEmbeds: number[][] = [];
    for (const t of existingTexts) {
      const v = await embed(t);
      if (v) existingEmbeds.push(v);
    }

    const accepted: Array<{ row: any; meta: any }> = [];
    for (let i = 0; i < goals.length; i++) {
      const d = (goals[i]?.description || '').trim();
      if (!d) continue;
      const v = await embed(d);
      if (!v) continue;
      // Nearest reference
      let bestSim = -1; let bestRef: { id: string | null; text?: string } = { id: null };
      for (const r of refEmbeds) {
        const s = cosine(v, r.v);
        if (s > bestSim) { bestSim = s; bestRef = { id: r.id, text: r.text }; }
      }
      if (bestSim < STYLE_MIN) { console.log('Drop candidate (strict)', { index: i, reason: 'style', bestSim }); continue; }
      // Duplicate check
      let dupSim = -1;
      for (const ev of existingEmbeds) {
        dupSim = Math.max(dupSim, cosine(v, ev));
      }
      if (dupSim > DUP_MAX) { console.log('Drop candidate (strict)', { index: i, reason: 'duplicate', dupSim }); continue; }

      accepted.push({
        row: {
          concept_id: conceptId,
          goal_description: d,
          bloom_level: goals[i]?.bloom_level ?? null,
          goal_type: goals[i]?.goal_type ?? null,
          sequence_order: i,
          status: 'suggested',
          metadata_json: {
            source: 'gemini_strict_v1',
            thresholds: { style_min: STYLE_MIN, duplicate_max: DUP_MAX },
            alignment: { nearest_similarity: Number(bestSim.toFixed(4)), nearest_reference_id: bestRef.id, reference_text: bestRef.text || null },
          },
        },
        meta: { sim: bestSim }
      });
    }

    if (!accepted.length) { console.warn('No goals accepted after filtering (strict).'); return 0; }

    console.log('Accepted goals (strict):', accepted.length);
    const { error: insertErr } = await supabase.from('learning_goals').insert(accepted.map(a => a.row));
    if (insertErr) {
      console.error('Insert learning_goals failed:', insertErr);
      return 0;
    }

    return accepted.length;
  } catch (err) {
    console.error('Strict fallback generation failed:', err);
    return 0;
  }
}

// Bootstrap generation for first-run when no approved references exist
async function generateGoalsBootstrap(supabase: any, conceptId: string, domain_slug: string, locationOverride?: string): Promise<number> {
  try {
    const sa = JSON.parse(GOOGLE_SA_JSON || "{}");
    const projectId = sa.project_id as string;
    const location = locationOverride || (sa.location as string) || 'us-central1';
    if (!projectId) {
      console.warn('Missing project_id in GOOGLE_CLOUD_SERVICE_ACCOUNT');
      return 0;
    }

    const accessToken = await getGoogleAccessTokenFromServiceAccount("https://www.googleapis.com/auth/cloud-platform");
    const genUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;
    console.log('Vertex model endpoint (bootstrap):', genUrl);
    const embUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/textembedding-gecko@003:predict`;

    // Concept details
    const { data: concept, error: conceptErr } = await supabase
      .from('concepts')
      .select('id, name, description')
      .eq('id', conceptId)
      .maybeSingle();
    if (conceptErr || !concept) {
      console.warn('Concept lookup failed for bootstrap generation:', conceptErr);
      return 0;
    }

    // Prompt without strict mimicry
    const prompt = `You are an expert pedagogy assistant. Generate 3-5 concise learning goals for the concept below.\n\n` +
      `STRICT OUTPUT: Return ONLY valid JSON: {"goals":[{"description":string,"bloom_level":string|null,"goal_type":string|null}]}. No extra text.\n` +
      `Guidelines:\n- Student-centered, action-oriented.\n- One sentence each (<= 20 words).\n- Clear, measurable verbs.\n- Avoid duplicates and near-duplicates.\n\n` +
      `Domain: ${domain_slug}\nConcept: ${concept.name}\nDescription: ${concept.description || ''}`;

    // Log prompt preview for diagnostics (truncated)
    const promptPreview = prompt.slice(0, 3000);
    console.log('LLM Prompt (bootstrap)', { concept_id: conceptId, domain_slug, location, length: prompt.length, preview: promptPreview });

    const genRes = await fetch(genUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}],
        generationConfig: { temperature: 0.4 },
      }),
    });

    // Parse Gemini or fall back to OpenAI
    let goals: Array<{ description: string; bloom_level?: string | null; goal_type?: string | null }> = [];
    if (genRes.ok) {
      const genJson = await genRes.json();
      const text = genJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const parsed = JSON.parse(text);
        goals = Array.isArray(parsed?.goals) ? parsed.goals : [];
      } catch (_) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { const parsed = JSON.parse(match[0]); goals = Array.isArray(parsed?.goals) ? parsed.goals : []; } catch {}
        }
      }
    } else {
      console.error(`Vertex AI request failed with status: ${genRes.status}`, { url: genUrl });
      const t = await genRes.text();
      console.error('Gemini bootstrap generation failed:', t);
      if (genRes.status === 404 && location !== 'europe-west4') {
        try {
          const altLocation = 'europe-west4';
          const genUrl2 = `https://${altLocation}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${altLocation}/publishers/google/models/gemini-2.5-flash:generateContent`;
          console.log('Retrying Vertex AI (bootstrap) in region', altLocation, 'url:', genUrl2);
          const genRes2 = await fetch(genUrl2, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }]}],
              generationConfig: { temperature: 0.4 },
            }),
          });
          if (genRes2.ok) {
            const genJson2 = await genRes2.json();
            const text2 = genJson2?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            try {
              const parsed2 = JSON.parse(text2);
              goals = Array.isArray(parsed2?.goals) ? parsed2.goals : [];
            } catch (_) {
              const match2 = text2.match(/\{[\s\S]*\}/);
              if (match2) {
                try { const parsed2 = JSON.parse(match2[0]); goals = Array.isArray(parsed2?.goals) ? parsed2.goals : []; } catch {}
              }
            }
          } else {
            console.error(`Vertex AI request failed with status: ${genRes2.status}`, { url: genUrl2 });
            const t2 = await genRes2.text();
            console.error('Gemini bootstrap retry failed:', t2);
          }
        } catch (re) {
          console.error('Gemini bootstrap retry error:', re);
        }
      }
      // goals remains [] if still failing
    }

    console.log('Parsed candidates (bootstrap):', goals.length);
    if (!goals.length) return 0;

    // Existing goals and embeddings for duplicate check (looser threshold)
    const { data: existing } = await supabase
      .from('learning_goals')
      .select('goal_description')
      .eq('concept_id', conceptId);
    const existingTexts = (existing || []).map((e: any) => e.goal_description).filter(Boolean);

    const embed = async (text: string): Promise<number[] | null> => {
      // NOTE: Using the 'predict' endpoint for stability.
      const embUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004:predict`;

      const body = {
        instances: [
          {
            content: text
          }
        ]
      };

      try {
        const r = await fetch(embUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!r.ok) {
          const responseText = await r.text();
          console.error(`Vertex AI request failed with status: ${r.status}`);
          console.error(`Vertex AI raw response: ${responseText}`);
          return null;
        }

        const j = await r.json();
        const vec = j?.predictions?.[0]?.embeddings?.values;
        return Array.isArray(vec) ? vec : null;
      } catch (e) {
        console.warn('Embed call failed', e);
        return null;
      }
    };
    const cosine = (a: number[], b: number[]) => {
      let dot = 0, na = 0, nb = 0;
      for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
    };

    const existingEmbeds: number[][] = [];
    for (const t of existingTexts) {
      const v = await embed(t);
      if (v) existingEmbeds.push(v);
    }

    const DUP_MAX = 0.95;
    const accepted: any[] = [];
    for (let i = 0; i < goals.length; i++) {
      const d = (goals[i]?.description || '').trim();
      if (!d) continue;
      // quick exact/ci duplicate block
      const ci = d.toLowerCase();
      if (existingTexts.some(et => (et || '').toLowerCase() === ci)) continue;

      // semantic near-duplicate check
      const v = await embed(d);
      if (v && existingEmbeds.length) {
        let dupSim = -1;
        for (const ev of existingEmbeds) dupSim = Math.max(dupSim, cosine(v, ev));
        if (dupSim > DUP_MAX) { console.log('Drop candidate (bootstrap)', { index: i, reason: 'duplicate', dupSim }); continue; }
      }

      accepted.push({
        concept_id: conceptId,
        goal_description: d,
        bloom_level: goals[i]?.bloom_level ?? null,
        goal_type: goals[i]?.goal_type ?? null,
        sequence_order: i,
        status: 'suggested',
        metadata_json: { source: 'gemini_bootstrap_v1' },
      });
    }

    if (!accepted.length) { console.warn('No goals accepted after filtering (bootstrap).'); return 0; }
    console.log('Accepted goals (bootstrap):', accepted.length);
    const { error: insertErr } = await supabase.from('learning_goals').insert(accepted);
    if (insertErr) {
      console.error('Insert learning_goals (bootstrap) failed:', insertErr);
      return 0;
    }

    console.log(`Bootstrap generation inserted ${accepted.length} goals for concept ${conceptId}`);
    return accepted.length;
  } catch (err) {
    console.error('Bootstrap generation failed:', err);
    return 0;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = (await req.json()) as RequestBody;
    const { concept_ids, domain_slug } = body || {};
    if (!Array.isArray(concept_ids) || concept_ids.length === 0 || !domain_slug) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get domain by slug to validate teacher assignment if needed
    const { data: domainRow, error: domainErr } = await supabase
      .from("domains")
      .select("id, slug")
      .eq("slug", domain_slug)
      .maybeSingle();

    if (domainErr || !domainRow) {
      console.error("Domain lookup failed:", domainErr);
      return new Response(JSON.stringify({ error: "Domain not found" }), { status: 404, headers: corsHeaders });
    }

    // Check role: admin or teacher assigned to domain
    const role = (user.app_metadata as any)?.role || (user.user_metadata as any)?.role;
    let allowed = role === "admin";

    if (!allowed) {
      const { data: assignment, error: assignErr } = await supabase
        .from("teacher_domains")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("domain_id", domainRow.id)
        .maybeSingle();

      if (assignErr) console.warn("Teacher assignment check error:", assignErr);
      allowed = !!assignment;
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // If caller requests local generation, skip Pub/Sub entirely
    if (body?.force_local) {
      let generatedCount = 0;
      const mode = (body as any)?.mode || (body?.strict_mimicry ? 'strict' : 'bootstrap');
      console.log('force_local generation mode:', mode);
      for (const cid of concept_ids) {
        if (mode === 'bootstrap') {
          generatedCount += await generateGoalsBootstrap(supabase, cid, domain_slug, body?.location);
        } else {
          generatedCount += await generateGoalsFallback(supabase, cid, domain_slug, body?.location);
        }
      }
      return new Response(
        JSON.stringify({ success: true, published: 0, generated: generatedCount, mode }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt Pub/Sub; fallback to direct generation if unavailable
    let publishedCount = 0;
    let generatedCount = 0;

    try {
      const sa = JSON.parse(GOOGLE_SA_JSON || "{}");
      const projectId = sa.project_id as string;
      if (!projectId) {
        throw new Error("Service account is missing project_id");
      }

      const accessToken = await getGoogleAccessTokenFromServiceAccount("https://www.googleapis.com/auth/pubsub");
      const topic = "learning-goal-generation-trigger";

      // Publish one message per concept_id, fallback per-item on failure
      for (const cid of concept_ids) {
        const messageData = { concept_id: cid, domain_slug };
        console.log("Publishing message:", messageData);
        try {
          await publishToPubSub(topic, messageData, accessToken, projectId);
          publishedCount++;
        } catch (perItemErr) {
          console.error("Pub/Sub publish failed for concept; falling back:", perItemErr);
          generatedCount += await generateGoalsFallback(supabase, cid, domain_slug, body?.location);
        }
      }
    } catch (setupErr) {
      console.warn("Pub/Sub setup failed; using fallback generation for all concepts.", setupErr);
      for (const cid of concept_ids) {
        generatedCount += await generateGoalsFallback(supabase, cid, domain_slug, body?.location);
      }
    }

    return new Response(
      JSON.stringify({ success: true, published: publishedCount, generated: generatedCount, mode: publishedCount > 0 ? (generatedCount > 0 ? 'mixed' : 'pubsub') : 'fallback' }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("trigger-learning-goal-generation error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
