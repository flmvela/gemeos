/* @ts-nocheck */
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@4.14.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_SA_JSON = Deno.env.get("GOOGLE_CLOUD_SERVICE_ACCOUNT") || "";

async function getGoogleAccessTokenFromServiceAccount(scope: string): Promise<string> {
  if (!GOOGLE_SA_JSON) throw new Error("Missing GOOGLE_CLOUD_SERVICE_ACCOUNT secret");
  const sa = JSON.parse(GOOGLE_SA_JSON);
  const privateKey = sa.private_key as string;
  const clientEmail = sa.client_email as string;
  const now = Math.floor(Date.now() / 1000);

  const alg = "RS256";
  const key = await importPKCS8(privateKey, alg);
  const jwt = await new SignJWT({
    iss: clientEmail,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg, typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { location: locBody, model: modelBody } = await req.json().catch(() => ({}));
    const sa = JSON.parse(GOOGLE_SA_JSON || "{}");
    const projectId = sa.project_id as string;
    const location = (locBody as string) || (sa.location as string) || "us-central1";
    const model = (modelBody as string) || "gemini-2.5-flash";

    if (!projectId) {
      return new Response(JSON.stringify({ ok: false, status: 400, message: "Missing project_id in service account" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const accessToken = await getGoogleAccessTokenFromServiceAccount("https://www.googleapis.com/auth/cloud-platform");

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Return OK if you can respond." }] }], generationConfig: { temperature: 0.0 } }),
    });

    const text = await res.text();
    const bodyExcerpt = text.slice(0, 400);

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, location, model, message: bodyExcerpt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("vertex-ai-smoke-test error:", e);
    return new Response(JSON.stringify({ ok: false, status: 500, message: String(e?.message || e) }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});