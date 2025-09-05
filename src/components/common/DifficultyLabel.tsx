
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useDifficultyLabels } from "@/hooks/useDifficultyLabels";
import { getDifficultyLabelForLevel } from "@/lib/difficulty";

type DifficultyLabelProps = {
  level: number | null | undefined;
  domainId?: string | null;
  showLevelPrefix?: boolean; // e.g. show "L3 — Advanced"
  className?: string;
};

export const DifficultyLabel: React.FC<DifficultyLabelProps> = ({
  level,
  domainId,
  showLevelPrefix = true,
  className,
}) => {
  const { data: labels, isLoading } = useDifficultyLabels(domainId ?? undefined);

  if (level == null) return null;

  const label = getDifficultyLabelForLevel(level, labels, domainId ?? undefined);
  const content = showLevelPrefix
    ? `${typeof level === "number" ? `L${level}` : ""}${label ? ` — ${label}` : ""}`
    : (label ?? `L${level}`);

  if (isLoading) {
    return (
      <Badge variant="secondary" className={className}>
        Loading…
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      {content}
    </Badge>
  );
};
