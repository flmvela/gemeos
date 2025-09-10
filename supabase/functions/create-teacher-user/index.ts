import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

type CreateTeacherRequest = {
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  temporaryPassword?: string;
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method Not Allowed" });
    }

    // --- Robust body parsing ---
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      console.error("Invalid content-type:", contentType);
      return jsonResponse(415, { error: "Unsupported Media Type. Use application/json." });
    }

    const raw = await req.text();
    console.log("Raw request body:", raw);
    
    if (!raw || !raw.trim()) {
      return jsonResponse(422, { error: "Empty request body." });
    }

    let body: CreateTeacherRequest;
    try {
      body = JSON.parse(raw);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return jsonResponse(422, { error: "Invalid JSON." });
    }

    // Normalize + validate
    const email = (body.email || "").trim().toLowerCase();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const tenantId = (body.tenantId || "").trim();

    console.log("Parsed request:", { email, firstName, lastName, tenantId, hasPassword: !!body.temporaryPassword });

    if (!email || !firstName || !lastName || !tenantId) {
      return jsonResponse(422, { 
        error: "Missing required fields: email, firstName, lastName, tenantId.",
        received: { email: !!email, firstName: !!firstName, lastName: !!lastName, tenantId: !!tenantId }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // AuthN
    const authz = req.headers.get("Authorization");
    if (!authz?.startsWith("Bearer ")) {
      return jsonResponse(401, { error: "Missing or invalid Authorization header." });
    }
    const token = authz.replace("Bearer ", "");

    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller) {
      console.error("Auth error:", authErr);
      return jsonResponse(401, { error: "Unauthorized." });
    }

    console.log("Caller:", { id: caller.id, email: caller.email, role: caller.app_metadata?.role });

    // AuthZ: allow platform_admin OR tenant_admin of the target tenant
    const isPlatformAdmin = caller.app_metadata?.role === "platform_admin";

    let isTenantAdmin = false;
    if (!isPlatformAdmin) {
      console.log("Checking tenant admin permissions for user:", caller.id, "tenant:", tenantId);
      
      // First get the user_tenant association
      const { data: ut, error: utErr } = await supabase
        .from("user_tenants")
        .select("role_id, status")
        .eq("user_id", caller.id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      console.log("user_tenants query result:", { ut, utErr });

      if (utErr) {
        console.error("user_tenants lookup error:", utErr);
        return jsonResponse(403, { error: "Failed to verify permissions for tenant. Error: " + utErr.message });
      }

      if (!ut) {
        console.log("No user_tenant association found");
        return jsonResponse(403, { error: "User is not associated with this tenant." });
      }

      // If we have a role_id, fetch the role details
      if (ut?.role_id) {
        const { data: role, error: roleErr } = await supabase
          .from("user_roles")
          .select("name")
          .eq("id", ut.role_id)
          .single();

        console.log("user_roles query result:", { role, roleErr });

        if (roleErr) {
          console.error("user_roles lookup error:", roleErr);
          return jsonResponse(403, { error: "Failed to verify user role. Error: " + roleErr.message });
        }
        
        isTenantAdmin = role?.name === "tenant_admin";
        console.log("Role name:", role?.name, "Is tenant admin:", isTenantAdmin);
      }
    }

    console.log("Authorization:", { isPlatformAdmin, isTenantAdmin });

    if (!isPlatformAdmin && !isTenantAdmin) {
      return jsonResponse(403, { error: "Forbidden: insufficient permissions." });
    }

    // Create the user
    const password = body.temporaryPassword || (crypto.randomUUID() + "Aa1!");
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        first_name: firstName, 
        last_name: lastName, 
        role: "teacher", 
        tenant_id: tenantId 
      },
      app_metadata: { 
        role: "teacher", 
        tenant_id: tenantId 
      },
    });

    if (createErr) {
      console.error("Create user error:", createErr);
      // Check for duplicate user
      const msg = (createErr as any)?.message || "Failed to create user";
      const isDup = msg.toLowerCase().includes("already registered") || 
                    msg.toLowerCase().includes("duplicate") ||
                    msg.toLowerCase().includes("already exists");
      return jsonResponse(isDup ? 409 : 500, { error: msg });
    }
    
    if (!created?.user) {
      return jsonResponse(500, { error: "User creation returned no user." });
    }

    console.log("User created successfully:", { userId: created.user.id, email: created.user.email });

    return jsonResponse(200, { success: true, userId: created.user.id, email });
  } catch (err) {
    console.error("create-teacher-user error:", err);
    return jsonResponse(500, { error: "Internal Server Error: " + String(err) });
  }
});