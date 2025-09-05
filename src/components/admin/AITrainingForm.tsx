
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AITrainingSetting,
  useUpsertAISettings,
  useDeleteAISettings,
} from "@/hooks/useAITrainingSettings";

type Props = {
  initial?: AITrainingSetting | null;
  scope: "global" | "domain" | "concept";
  targetIds?: { domain_id?: string | null; concept_id?: string | null };
  showDelete?: boolean;
};

const MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-8b",
];

const REGIONS = [
  "europe-west4",
  "us-central1",
];

export function AITrainingForm({ initial, scope, targetIds, showDelete }: Props) {
  const { toast } = useToast();
  const upsert = useUpsertAISettings();
  const del = useDeleteAISettings();

  const [modelName, setModelName] = useState(initial?.model_name ?? "gemini-2.5-flash");
  const [region, setRegion] = useState(initial?.region ?? "europe-west4");
  const [temperature, setTemperature] = useState(initial?.temperature ?? 0.2);
  const [topP, setTopP] = useState(initial?.top_p ?? 0.95);
  const [maxTokens, setMaxTokens] = useState(initial?.max_output_tokens ?? 512);
  const [candidateCount, setCandidateCount] = useState(initial?.candidate_count ?? 5);

  const [styleMin, setStyleMin] = useState(initial?.style_similarity_min ?? 0.8);
  const [dupMax, setDupMax] = useState(initial?.duplicate_similarity_max ?? 0.92);
  const [applyStrict, setApplyStrict] = useState(initial?.apply_strict_filter ?? true);
  const [fallbackBootstrap, setFallbackBootstrap] = useState(initial?.fallback_to_bootstrap ?? true);
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);

  useEffect(() => {
    if (!initial) return;
    setModelName(initial.model_name);
    setRegion(initial.region);
    setTemperature(initial.temperature);
    setTopP(initial.top_p);
    setMaxTokens(initial.max_output_tokens);
    setCandidateCount(initial.candidate_count);
    setStyleMin(initial.style_similarity_min);
    setDupMax(initial.duplicate_similarity_max);
    setApplyStrict(initial.apply_strict_filter);
    setFallbackBootstrap(initial.fallback_to_bootstrap);
    setEnabled(initial.enabled);
  }, [initial?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    const payload: any = {
      scope,
      model_name: modelName,
      region,
      temperature: Number(temperature),
      top_p: Number(topP),
      max_output_tokens: Number(maxTokens),
      candidate_count: Number(candidateCount),
      style_similarity_min: Number(styleMin),
      duplicate_similarity_max: Number(dupMax),
      apply_strict_filter: !!applyStrict,
      fallback_to_bootstrap: !!fallbackBootstrap,
      enabled: !!enabled,
    };

    if (scope === "domain") payload.domain_id = targetIds?.domain_id;
    if (scope === "concept") payload.concept_id = targetIds?.concept_id;

    console.log("Saving AI settings", payload);

    const res = await upsert.mutateAsync(payload);
    toast({ title: "Saved", description: "AI Training settings updated." });
    return res;
  };

  const handleDelete = async () => {
    if (scope === "global") return;
    if (scope === "domain" && targetIds?.domain_id) {
      await del.mutateAsync({ scope: "domain", domain_id: targetIds.domain_id });
      toast({ title: "Override removed", description: "Domain override deleted. Global settings now apply." });
    } else if (scope === "concept" && targetIds?.concept_id) {
      await del.mutateAsync({ scope: "concept", concept_id: targetIds.concept_id });
      toast({ title: "Override removed", description: "Concept override deleted. Domain/global settings now apply." });
    }
  };

  const numberHint = (v: number, min?: number, max?: number) => {
    const parts: string[] = [`${v}`];
    if (min !== undefined) parts.push(`min ${min}`);
    if (max !== undefined) parts.push(`max ${max}`);
    return parts.join(" • ");
  };

  return (
    <div className="space-y-6">
      {/* Settings table */}
      <div className="rounded-lg border divide-y divide-border">
        {/* Model */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Model</Label>
            <p className="text-xs text-muted-foreground">Choose the Gemini model. Bigger models improve quality; smaller are faster and cheaper.</p>
          </div>
          <div className="space-y-2">
            <Select value={modelName} onValueChange={setModelName}>
              <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Region */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Region</Label>
            <p className="text-xs text-muted-foreground">Vertex AI region. Pick the closest for lower latency and data residency needs.</p>
          </div>
          <div className="space-y-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Temperature */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Temperature</Label>
            <p className="text-xs text-muted-foreground">Controls randomness. Lower is more deterministic; higher is more creative.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" step="0.05" min="0" max="1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{numberHint(temperature, 0, 1)}</p>
          </div>
        </div>

        {/* Top P */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Top P</Label>
            <p className="text-xs text-muted-foreground">Nucleus sampling. Lower values consider fewer tokens; 1 uses full distribution.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" step="0.01" min="0" max="1" value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{numberHint(topP, 0, 1)}</p>
          </div>
        </div>

        {/* Max Output Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Max Output Tokens</Label>
            <p className="text-xs text-muted-foreground">Hard cap on response length. Higher allows longer answers but costs more.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" min="1" value={maxTokens} onChange={(e) => setMaxTokens(Number(e.target.value))} />
          </div>
        </div>

        {/* Candidate Count */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Candidate Count</Label>
            <p className="text-xs text-muted-foreground">Generate multiple candidates. Improves choice at the cost of latency and tokens.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" min="1" value={candidateCount} onChange={(e) => setCandidateCount(Number(e.target.value))} />
          </div>
        </div>

        {/* Style Similarity Min */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Style Similarity Min</Label>
            <p className="text-xs text-muted-foreground">Accept only when cosine similarity to the desired style meets this threshold.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" step="0.01" min="0" max="1" value={styleMin} onChange={(e) => setStyleMin(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{numberHint(styleMin, 0, 1)}</p>
          </div>
        </div>

        {/* Duplicate Similarity Max */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Duplicate Similarity Max</Label>
            <p className="text-xs text-muted-foreground">Treat as duplicate when similarity to existing content is above this threshold.</p>
          </div>
          <div className="space-y-2">
            <Input type="number" step="0.01" min="0" max="1" value={dupMax} onChange={(e) => setDupMax(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{numberHint(dupMax, 0, 1)}</p>
          </div>
        </div>

        {/* Apply strict filter */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Apply strict filter</Label>
            <p className="text-xs text-muted-foreground">Enforce the similarity thresholds strictly. May drop low‑quality outputs.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={applyStrict} onCheckedChange={setApplyStrict} id="apply_strict" />
            <Label htmlFor="apply_strict" className="text-foreground">Enabled</Label>
          </div>
        </div>

        {/* Fallback to bootstrap */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Fallback to bootstrap</Label>
            <p className="text-xs text-muted-foreground">If strict filtering rejects all results, fall back to a simple baseline.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={fallbackBootstrap} onCheckedChange={setFallbackBootstrap} id="fallback_bootstrap" />
            <Label htmlFor="fallback_bootstrap" className="text-foreground">Enabled</Label>
          </div>
        </div>

        {/* Enabled */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
          <div>
            <Label className="text-foreground">Enabled</Label>
            <p className="text-xs text-muted-foreground">Master switch for this scope. Turn off to disable AI generation here.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} id="enabled" />
            <Label htmlFor="enabled" className="text-foreground">Enabled</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="shrink-0">Save settings</Button>
        {showDelete && scope !== "global" && (
          <Button variant="destructive" onClick={handleDelete} className="shrink-0">
            Remove override
          </Button>
        )}
      </div>
    </div>
  );
}
