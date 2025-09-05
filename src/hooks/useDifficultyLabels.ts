
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DifficultyLevelLabel {
  id: string;
  level_value: number;
  label: string;
  description: string | null;
  color: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch difficulty labels for a given domain, including global (null) labels.
// We prefer domain-specific labels when both exist for the same level.
export function useDifficultyLabels(domainId?: string) {
  return useQuery({
    queryKey: ["difficulty-level-labels", domainId || "global"],
    queryFn: async () => {
      console.log('🔍 Fetching difficulty labels for domainId:', domainId);

      const { data, error } = await supabase
        .from("difficulty_level_labels")
        .select("*");

      if (error) {
        console.error("Error fetching difficulty level labels:", error);
        throw error;
      }

      console.log('🔍 Difficulty labels fetched:', data);

      // Sort by display_order, then level_value (removed domain filtering for now)
      const sorted = (data ?? []).sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return a.level_value - b.level_value;
      });

      return sorted as DifficultyLevelLabel[];
    },
    meta: {
      onError: (err: unknown) => {
        console.error("useDifficultyLabels query error", err);
      },
    },
    staleTime: 60_000,
  });
}
