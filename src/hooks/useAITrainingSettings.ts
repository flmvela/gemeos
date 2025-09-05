
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type AITrainingSetting = {
  id?: string;
  scope: "global" | "domain" | "concept";
  domain_id?: string | null;
  concept_id?: string | null;

  model_name: string;
  region: string;
  temperature: number;
  top_p: number;
  max_output_tokens: number;
  candidate_count: number;

  style_similarity_min: number;
  duplicate_similarity_max: number;
  apply_strict_filter: boolean;
  fallback_to_bootstrap: boolean;
  enabled: boolean;

  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

type UpsertParams =
  | ({ scope: "global" } & Partial<AITrainingSetting>)
  | ({ scope: "domain"; domain_id: string } & Partial<AITrainingSetting>)
  | ({ scope: "concept"; concept_id: string } & Partial<AITrainingSetting>);

export const aiSettingsKeys = {
  all: ["ai-training-settings"] as const,
  global: () => [...aiSettingsKeys.all, "global"] as const,
  domain: (domainId?: string | null) => [...aiSettingsKeys.all, "domain", domainId || "none"] as const,
  concept: (conceptId?: string | null) => [...aiSettingsKeys.all, "concept", conceptId || "none"] as const,
  effective: (params: { domainId?: string | null; conceptId?: string | null }) =>
    [...aiSettingsKeys.all, "effective", params.domainId || "none", params.conceptId || "none"] as const,
};

async function fetchSingle<T = AITrainingSetting>(
  match: Partial<Pick<AITrainingSetting, "scope" | "domain_id" | "concept_id">>
): Promise<T | null> {
  // Note: cast to any to avoid compile-time errors until Supabase types include ai_training_settings
  const client = supabase as any;
  let q = client.from("ai_training_settings").select("*").limit(1);
  if (match.scope) q = q.eq("scope", match.scope);
  if (match.domain_id !== undefined) q = q.eq("domain_id", match.domain_id);
  if (match.concept_id !== undefined) q = q.eq("concept_id", match.concept_id);

  const { data, error } = await q.maybeSingle();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = Results contain 0 rows
    throw error;
  }
  return (data as unknown as T) ?? null;
}

export function useGlobalAISettings() {
  return useQuery({
    queryKey: aiSettingsKeys.global(),
    queryFn: () => fetchSingle({ scope: "global" }),
  });
}

export function useDomainAISettings(domainId?: string | null) {
  return useQuery({
    queryKey: aiSettingsKeys.domain(domainId),
    queryFn: () => (domainId ? fetchSingle({ scope: "domain", domain_id: domainId }) : Promise.resolve(null)),
    enabled: !!domainId,
  });
}

export function useConceptAISettings(conceptId?: string | null) {
  return useQuery({
    queryKey: aiSettingsKeys.concept(conceptId),
    queryFn: () => (conceptId ? fetchSingle({ scope: "concept", concept_id: conceptId }) : Promise.resolve(null)),
    enabled: !!conceptId,
  });
}

/**
 * Get effective settings for a given context:
 * concept override -> domain override -> global defaults
 * Requires either conceptId or domainId (or both).
 */
export function useEffectiveAISettings(params: { conceptId?: string | null; domainId?: string | null }) {
  const { conceptId, domainId } = params;
  return useQuery({
    queryKey: aiSettingsKeys.effective({ conceptId: conceptId || null, domainId: domainId || null }),
    queryFn: async () => {
      // Try concept-level
      if (conceptId) {
        const conceptLevel = await fetchSingle({ scope: "concept", concept_id: conceptId });
        if (conceptLevel) return conceptLevel as AITrainingSetting;
      }
      // Try domain-level
      if (domainId) {
        const domainLevel = await fetchSingle({ scope: "domain", domain_id: domainId });
        if (domainLevel) return domainLevel as AITrainingSetting;
      }
      // Fallback to global
      const global = await fetchSingle({ scope: "global" });
      return global as AITrainingSetting | null;
    },
    enabled: !!(conceptId || domainId),
  });
}

export function useUpsertAISettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertParams) => {
      const base: Partial<AITrainingSetting> = {
        model_name: payload.model_name ?? "gemini-2.5-flash",
        region: payload.region ?? "europe-west4",
        temperature: payload.temperature ?? 0.2,
        top_p: payload.top_p ?? 0.95,
        max_output_tokens: payload.max_output_tokens ?? 512,
        candidate_count: payload.candidate_count ?? 5,
        style_similarity_min: payload.style_similarity_min ?? 0.8,
        duplicate_similarity_max: payload.duplicate_similarity_max ?? 0.92,
        apply_strict_filter: payload.apply_strict_filter ?? true,
        fallback_to_bootstrap: payload.fallback_to_bootstrap ?? true,
        enabled: payload.enabled ?? true,
      };

      const client = supabase as any;

      if (payload.scope === "global") {
        const row = { ...base, scope: "global", domain_id: null, concept_id: null };
        const { data, error } = await client
          .from("ai_training_settings")
          .upsert(row, { onConflict: "scope" })
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as AITrainingSetting;
      }

      if (payload.scope === "domain") {
        const row = { ...base, scope: "domain", domain_id: payload.domain_id, concept_id: null };
        const { data, error } = await client
          .from("ai_training_settings")
          .upsert(row, { onConflict: "scope,domain_id" })
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as AITrainingSetting;
      }

      // concept
      const row = { ...base, scope: "concept", concept_id: payload.concept_id, domain_id: null };
      const { data, error } = await client
        .from("ai_training_settings")
        .upsert(row, { onConflict: "scope,concept_id" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as AITrainingSetting;
    },
    meta: {
      onError: (err: any) => {
        console.error("Failed to upsert AI training settings:", err);
      },
    },
    onSettled: async (_data, _err, variables) => {
      await qc.invalidateQueries({ queryKey: aiSettingsKeys.all as any });
      if ((variables as any)?.scope === "global") {
        await qc.invalidateQueries({ queryKey: aiSettingsKeys.global() as any });
      }
    },
  });
}

export function useDeleteAISettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { scope: "domain"; domain_id: string } | { scope: "concept"; concept_id: string }) => {
      const client = supabase as any;
      if (payload.scope === "domain") {
        const { error } = await client
          .from("ai_training_settings")
          .delete()
          .eq("scope", "domain")
          .eq("domain_id", payload.domain_id);
        if (error) throw error;
        return;
      }
      const { error } = await client
        .from("ai_training_settings")
        .delete()
        .eq("scope", "concept")
        .eq("concept_id", payload.concept_id);
      if (error) throw error;
    },
    meta: {
      onError: (err: any) => {
        console.error("Failed to delete AI training settings override:", err);
      },
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: aiSettingsKeys.all as any });
    },
  });
}

