/* @ts-nocheck */
// Unified Vertex AI Diagnostics Function
// Purpose: Comprehensive diagnostics and testing of Vertex AI access with multiple models, regions, and detailed results
// - Auth required (uses caller's JWT via Supabase client)
// - Does NOT touch database; only tests service account + Vertex endpoints
// - Combines simple smoke test and comprehensive diagnostics

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

interface DiagnosticsRequest {
  mode?: 'quick' | 'comprehensive'; // Default: quick
  regions?: string[]; // Specific regions to test
  models?: string[]; // Specific models to test
  location?: string; // For quick mode
  model?: string; // For quick mode
}

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

async function quickSmokeTest(
  projectId: string, 
  location: string, 
  model: string, 
  accessToken: string
): Promise<any> {
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ role: "user", parts: [{ text: "Return ONLY this JSON: {\"test\":\"ok\"}" }] }], 
        generationConfig: { temperature: 0.0 } 
      }),
    });

    const text = await res.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch {
      parsedResponse = text.slice(0, 400); // Truncate for display
    }

    return {
      location,
      model,
      url,
      status: res.status,
      ok: res.ok,
      response: parsedResponse,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      location,
      model,
      url,
      error: String(e),
      timestamp: new Date().toISOString()
    };
  }
}

async function comprehensiveDiagnostics(
  projectId: string,
  requestedRegions: string[],
  requestedModels: string[],
  accessToken: string
): Promise<any[]> {
  const sa = GOOGLE_SA_JSON ? JSON.parse(GOOGLE_SA_JSON) : {};
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

  const attempts: any[] = [];
  
  console.log(`Testing ${candidateRegions.length} regions × ${candidateModels.length} models = ${candidateRegions.length * candidateModels.length} combinations`);
  
  for (const region of candidateRegions) {
    for (const model of candidateModels) {
      const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;
      try {
        const startTime = Date.now();
        const r = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contents: [{ role: "user", parts: [{ text: "Return ONLY this JSON: {\"ok\":true}" }] }], 
            generationConfig: { temperature: 0 } 
          }),
        });
        const responseTime = Date.now() - startTime;
        const text = await r.text();
        
        let parsedBody;
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text;
        }

        attempts.push({ 
          region, 
          model, 
          url, 
          status: r.status, 
          ok: r.ok, 
          responseTimeMs: responseTime,
          body: parsedBody,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        attempts.push({ 
          region, 
          model, 
          url, 
          error: String(e),
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  return attempts;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
      global: { headers: { Authorization: req.headers.get("Authorization")! } } 
    });
    
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user || null;

    const body: DiagnosticsRequest = await req.json().catch(() => ({}));
    const {
      mode = 'quick',
      regions: requestedRegions = [],
      models: requestedModels = [],
      location: quickLocation,
      model: quickModel
    } = body;

    const sa = GOOGLE_SA_JSON ? JSON.parse(GOOGLE_SA_JSON) : {};
    const projectId: string = sa.project_id || "";
    const saLocation: string = sa.location || "";

    if (!projectId) {
      return new Response(JSON.stringify({ 
        error: "Missing project_id in service account configuration",
        hasServiceAccount: !!GOOGLE_SA_JSON
      }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Starting Vertex AI diagnostics in ${mode} mode`);

    // Get access token
    const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/cloud-platform");
    console.log("Access token obtained successfully");

    const maskedSa = sa ? { 
      project_id: sa.project_id, 
      client_email: sa.client_email?.replace(/^[^@]*/, (m: string) => m.replace(/.(?=.{4})/g, "*")), 
      location: sa.location || null 
    } : null;

    if (mode === 'quick') {
      // Quick smoke test mode
      const location = quickLocation || saLocation || "us-central1";
      const model = quickModel || "gemini-2.5-flash";
      
      console.log(`Quick test: ${location} / ${model}`);
      const result = await quickSmokeTest(projectId, location, model, accessToken);

      return new Response(JSON.stringify({
        mode: 'quick',
        user: user ? { id: user.id, email: user.email } : null,
        service_account: maskedSa,
        test_location: location,
        test_model: model,
        result,
        success: result.ok || false,
        message: result.ok ? "Quick test passed" : "Quick test failed"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      // Comprehensive diagnostics mode
      console.log("Running comprehensive diagnostics...");
      const attempts = await comprehensiveDiagnostics(
        projectId,
        requestedRegions,
        requestedModels,
        accessToken
      );

      const successful = attempts.filter(a => a.ok);
      const failed = attempts.filter(a => !a.ok && !a.error);
      const errors = attempts.filter(a => a.error);

      console.log(`Diagnostics complete: ${successful.length} successful, ${failed.length} failed, ${errors.length} errors`);

      return new Response(JSON.stringify({
        mode: 'comprehensive',
        user: user ? { id: user.id, email: user.email } : null,
        service_account: maskedSa,
        summary: {
          total_tests: attempts.length,
          successful: successful.length,
          failed: failed.length,
          errors: errors.length,
          success_rate: attempts.length > 0 ? Math.round((successful.length / attempts.length) * 100) : 0
        },
        tested_regions: Array.from(new Set(attempts.map(a => a.region))),
        tested_models: Array.from(new Set(attempts.map(a => a.model))),
        attempts,
        recommendations: {
          best_performers: successful.slice(0, 3).map(a => ({ region: a.region, model: a.model, responseTime: a.responseTimeMs })),
          regions_to_avoid: errors.map(a => a.region).filter((r, i, arr) => arr.indexOf(r) === i),
          models_to_avoid: errors.map(a => a.model).filter((m, i, arr) => arr.indexOf(m) === i)
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("Vertex AI diagnostics error:", e);
    return new Response(JSON.stringify({ 
      error: String(e?.message || e),
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});