/* @ts-nocheck */
// Supabase Edge Function: vertex-ai-diagnostics
// Purpose: Diagnose Vertex AI access by trying multiple models and regions and returning detailed results.
// - Auth required (uses caller's JWT via Supabase client only for identity if needed)
// - Does NOT touch database; only tests service account + Vertex endpoints

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@4.14.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GOOGLE_SA_JSON = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT") || "";

async function getGoogleAccessToken(scope: string): Promise<string> {
  if (!GOOGLE_SA_JSON) throw new Error("Missing GOOGLE_CLOUD_SERVICE_ACCOUNT secret");
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
  const alg = "RS256";
  const key = await importPKCS8(privateKey, alg);
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const j = await tokenRes.json();
  return j.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization")! } } });
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user || null;

    const body = await req.json().catch(() => ({}));
    const requestedRegions: string[] = Array.isArray(body?.regions) ? body.regions : [];
    const requestedModels: string[] = Array.isArray(body?.models) ? body.models : [];

    const sa = GOOGLE_SA_JSON ? JSON.parse(GOOGLE_SA_JSON) : {};
    const projectId: string = sa.project_id || "";
    const saLocation: string = sa.location || "";

    const candidateRegions = Array.from(new Set([
      ...(requestedRegions.length ? requestedRegions : []),
      saLocation,
      "europe-west4",
      "us-central1",
    ].filter(Boolean)));

    const candidateModels = Array.from(new Set([
      ...(requestedModels.length ? requestedModels : []),
      "gemini-2.5-flash",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
    ]));

    const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/cloud-platform");

    const attempts: any[] = [];
    for (const region of candidateRegions) {
      for (const model of candidateModels) {
        const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;
        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Return ONLY this JSON: {\"ok\":true}" }] }], generationConfig: { temperature: 0 } }),
          });
          const text = await r.text();
          attempts.push({ region, model, url, status: r.status, ok: r.ok, body: (() => { try { return JSON.parse(text); } catch { return text; } })() });
        } catch (e) {
          attempts.push({ region, model, url, error: String(e) });
        }
      }
    }

    const maskedSa = sa ? { project_id: sa.project_id, client_email: sa.client_email?.replace(/^[^@]*/, (m: string) => m.replace(/.(?=.{4})/g, "*")), location: sa.location || null } : null;

    return new Response(JSON.stringify({
      user: user ? { id: user.id, email: user.email } : null,
      service_account: maskedSa,
      tested_regions: candidateRegions,
      tested_models: candidateModels,
      attempts,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("vertex-ai-diagnostics error:", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
