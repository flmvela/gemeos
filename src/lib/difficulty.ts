
import type { DifficultyLevelLabel } from "@/hooks/useDifficultyLabels";

// Build a map preferring domain-specific labels over global for each level
export function buildDifficultyLabelMap(
  labels: DifficultyLevelLabel[] | undefined,
  preferredDomainId?: string
): Map<number, DifficultyLevelLabel> {
  const map = new Map<number, DifficultyLevelLabel>();
  if (!labels) return map;

  for (const lbl of labels) {
    const existing = map.get(lbl.level_value);
    if (!existing) {
      map.set(lbl.level_value, lbl);
      continue;
    }
    // If existing is global and new one is domain-specific for preferredDomainId, replace
    const existingIsPreferred = existing.domain_id === preferredDomainId;
    const currentIsPreferred = lbl.domain_id === preferredDomainId;
    if (!existingIsPreferred && currentIsPreferred) {
      map.set(lbl.level_value, lbl);
    }
  }

  return map;
}

export function getDifficultyLabelForLevel(
  level: number | null | undefined,
  labels: DifficultyLevelLabel[] | undefined,
  preferredDomainId?: string
): string | undefined {
  if (level == null) return undefined;
  const map = buildDifficultyLabelMap(labels, preferredDomainId);
  return map.get(level)?.label;
}
