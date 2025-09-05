
import { useMemo } from "react";
import { useConcepts } from "@/hooks/useConcepts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  domainId?: string | null;
  label?: string;
  value?: string | null;
  onChange: (conceptId: string | null) => void;
  placeholder?: string;
};

export function ConceptSelect({ domainId, label = "Concept", value, onChange, placeholder = "Select a concept" }: Props) {
  const { concepts } = useConcepts(domainId || "");

  const options = useMemo(
    () => (concepts || []).map((c) => ({ id: c.id as string, name: c.name as string })),
    [concepts]
  );

  return (
    <div className="space-y-2">
      {label && <Label className="text-foreground">{label}</Label>}
      <Select value={value || ""} onValueChange={(v) => onChange(v || null)} disabled={!domainId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {(options || []).map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

