import { useEffect, useMemo, useState } from "react";
import { TeacherLayout } from "@/components/TeacherLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { DomainSelect } from "@/components/admin/DomainSelect";
import { ConceptSelect } from "@/components/admin/ConceptSelect";
import {
  useGlobalAISettings,
  useDomainAISettings,
  useConceptAISettings,
  useEffectiveAISettings,
} from "@/hooks/useAITrainingSettings";
import { AITrainingForm } from "@/components/admin/AITrainingForm";
import { useDomains } from "@/hooks/useDomains";
import { useConcepts } from "@/hooks/useConcepts";

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function AdminAITraining() {
  const { toast } = useToast();
  const qp = useQueryParams();
  const navigate = useNavigate();

  // Optional preselection via ?domain=<slug or id>&conceptId=<uuid>
  const preselectDomainParam = qp.get("domain");
  const preselectConcept = qp.get("conceptId");

  // Fix: use the correct return shape from useDomains()
  const { domains: allDomains } = useDomains();

  const domainFromSlug = useMemo(() => {
    if (!preselectDomainParam || !allDomains) return null;
    return allDomains.find((d: any) => d.slug === preselectDomainParam || d.id === preselectDomainParam) || null;
  }, [allDomains, preselectDomainParam]);

  const [domainId, setDomainId] = useState<string | null>(domainFromSlug?.id || null);
  const [conceptId, setConceptId] = useState<string | null>(preselectConcept || null);

  useEffect(() => {
    if (domainFromSlug?.id) setDomainId(domainFromSlug.id);
  }, [domainFromSlug?.id]);

  // Loaders
  const { data: globalSettings } = useGlobalAISettings();
  const { data: domainSettings } = useDomainAISettings(domainId || undefined);
  const { data: conceptSettings } = useConceptAISettings(conceptId || undefined);

  // Fix: use the correct return shape from useConcepts()
  const { concepts: conceptsInDomain } = useConcepts(domainId || "");

  const { data: effective } = useEffectiveAISettings({ domainId, conceptId });

  const resetConceptIfDomainChanged = (newDomainId: string | null) => {
    if (!newDomainId) {
      setConceptId(null);
      return;
    }
    // If current concept doesn't belong to new domain, clear it
    if (conceptId && conceptsInDomain && !conceptsInDomain.some((c: any) => c.id === conceptId)) {
      setConceptId(null);
    }
  };

  useEffect(() => {
    document.title = "Admin AI Training Settings";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Configure AI training settings: model, region, temperature, tokens, filters.');
  }, []);

  return (
    <TeacherLayout>
      <div className="w-full px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">AI Training Settings</h1>
          <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="domain">Domain</TabsTrigger>
            <TabsTrigger value="concept">Concept</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Global defaults</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AITrainingForm scope="global" initial={globalSettings || null} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Domain override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <DomainSelect
                    value={domainId}
                    onChange={(v) => {
                      setDomainId(v);
                      resetConceptIfDomainChanged(v);
                    }}
                  />
                </div>
                <AITrainingForm scope="domain" initial={domainSettings || null} targetIds={{ domain_id: domainId || undefined }} showDelete />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="concept" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Concept override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <DomainSelect
                    value={domainId}
                    onChange={(v) => {
                      setDomainId(v);
                      resetConceptIfDomainChanged(v);
                    }}
                  />
                  <ConceptSelect domainId={domainId || undefined} value={conceptId} onChange={setConceptId} />
                </div>
                <AITrainingForm
                  scope="concept"
                  initial={conceptSettings || null}
                  targetIds={{ concept_id: conceptId || undefined }}
                  showDelete
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Effective settings preview</CardTitle>
            </CardHeader>
            <CardContent>
              {effective ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Scope</div>
                    <div className="text-foreground font-medium">{effective.scope}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Model</div>
                    <div className="text-foreground">{effective.model_name} ({effective.region})</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Temperature / TopP</div>
                    <div className="text-foreground">{effective.temperature} / {effective.top_p}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Max Tokens / Candidates</div>
                    <div className="text-foreground">{effective.max_output_tokens} / {effective.candidate_count}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Style min</div>
                    <div className="text-foreground">{effective.style_similarity_min}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Duplicate max</div>
                    <div className="text-foreground">{effective.duplicate_similarity_max}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Flags</div>
                    <div className="text-foreground">
                      strict={String(effective.apply_strict_filter)} • fallback={String(effective.fallback_to_bootstrap)} • enabled={String(effective.enabled)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Select a domain and/or concept to preview the effective settings.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherLayout>
  );
}
