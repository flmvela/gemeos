
import { useMemo } from "react";
import { useDomains } from "@/hooks/useDomains";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  label?: string;
  value?: string | null;
  onChange: (domainId: string | null) => void;
  placeholder?: string;
};

export function DomainSelect({ label = "Domain", value, onChange, placeholder = "Select a domain" }: Props) {
  const { domains } = useDomains();

  const options = useMemo(
    () => (domains || []).map((d) => ({ id: d.id as string, name: d.name as string, slug: (d as any).slug as string | undefined })),
    [domains]
  );

  return (
    <div className="space-y-2">
      {label && <Label className="text-foreground">{label}</Label>}
      <Select value={value || ""} onValueChange={(v) => onChange(v || null)}>
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

