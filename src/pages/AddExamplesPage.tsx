import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDomains } from '@/hooks/useDomains';
import { useConceptExamples } from '@/hooks/useConceptExamples';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Download, Upload, Plus, Trash2, Save } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DynamicBreadcrumb } from '@/components/navigation/DynamicBreadcrumb';

// Minimal local type mirroring the ExamplesManager type
interface ConceptExample {
  id: string;
  snippet: string;
  concepts: string[];
  notes?: string;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  created_at: string;
  // Extended fields used only in this page for bulk -> learning_goals
  concept_id?: string;
  approved?: boolean;
  bloom_level?: string | null;
  goal_type?: string | null;
  sequence_order?: number | null;
}

interface ConceptLite {
  id: string;
  name: string;
}

const AddExamplesPage = () => {
  const navigate = useNavigate();
  const { domainId, area } = useParams<{ domainId: string; area: string }>();
  const { domains } = useDomains();
  const domain = useMemo(() => domains?.find(d => d.id === domainId), [domains, domainId]);
  const domainName = domain?.name || '';
  const { toast } = useToast();

  const { examples, saveExamples } = useConceptExamples(domainId || '', domainName, area || '');

  const [allConcepts, setAllConcepts] = useState<ConceptLite[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'manual' | 'bulk'>('manual');

  // Manual examples data
  const [manualExamples, setManualExamples] = useState<Array<{ snippet: string }>>([
    { snippet: '' }
  ]);
  const [manualApproved, setManualApproved] = useState<boolean>(true);

  // Parsed examples from CSV
  const [bulkExamples, setBulkExamples] = useState<ConceptExample[]>([]);

  const selectedConcept = useMemo(
    () => allConcepts.find(c => c.id === selectedId) || null,
    [allConcepts, selectedId]
  );

  // SEO basic tags
  useEffect(() => {
    const title = `Add Examples — ${domain?.name || 'Domain'}`;
    document.title = title;
    const descText = `Add learning goal examples for ${domain?.name || 'your domain'} in ${area || ''}.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', descText);
  }, [domain?.name, area]);

  // Load concepts for this domain
  useEffect(() => {
    const load = async () => {
      if (!domainId) return;
      const { data, error } = await supabase
        .from('concepts')
        .select('id, name')
        .eq('domain_id', domainId)
        .eq('status', 'approved')
        .order('name', { ascending: true });
      if (!error) setAllConcepts((data as any[])?.map(r => ({ id: r.id, name: r.name })) || []);
    };
    load();
  }, [domainId]);

  const filteredConcepts = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return allConcepts;
    return allConcepts.filter(c => c.name.toLowerCase().includes(s));
  }, [allConcepts, search]);

  // Single-select: use radio group to set selected concept
  const onSelectConcept = (id: string) => setSelectedId(id);

  const addManualRow = () => setManualExamples(prev => [...prev, { snippet: '' }]);
  const removeManualRow = (idx: number) => setManualExamples(prev => prev.filter((_, i) => i !== idx));

  const handleDownloadTemplate = () => {
    if (!selectedConcept) {
      toast({ title: 'Select a concept first' });
      return;
    }
    const rows = [{
      concept_id: selectedConcept.id,
      concept_name: selectedConcept.name,
      goal_description: '',
      bloom_level: '',
      goal_type: '',
      sequence_order: '',
      approved: 'yes'
    }];
    const csv = Papa.unparse(rows, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domainName || 'domain'}_${area || 'area'}_learning_goals_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[]) || [];
        const parsed: ConceptExample[] = [];
        for (const r of rows) {
          const gd = (r.goal_description || '').toString().trim();
          const snippetCsv = (r.snippet || '').toString().trim();
          const snippet = gd || snippetCsv; // prefer goal_description
          const cname = (r.concept_name || '').toString().trim();
          const cid = (r.concept_id || '').toString().trim();
          const difficulty = (r.difficulty || '').toString().trim().toLowerCase();
          const notes = (r.notes || '').toString();
          const approvedStr = (r.approved ?? 'yes').toString().trim().toLowerCase();
          const approved = ['yes','true','1','y'].includes(approvedStr);
          const bloom_level = (r.bloom_level || '').toString().trim() || null;
          const goal_type = (r.goal_type || '').toString().trim() || null;
          const seqRaw = (r.sequence_order ?? '').toString().trim();
          const sequence_order = seqRaw === '' ? null : Number(seqRaw);
          if (!snippet || (!cname && !cid)) continue;
          parsed.push({
            id: crypto.randomUUID(),
            snippet,
            concepts: [cname || ''],
            notes: notes || undefined,
            difficulty: difficulty === 'basic' || difficulty === 'intermediate' || difficulty === 'advanced' ? difficulty : undefined,
            created_at: new Date().toISOString(),
            concept_id: cid || undefined,
            approved,
            bloom_level,
            goal_type,
            sequence_order,
          });
        }
        setBulkExamples(parsed);
        toast({ title: 'CSV parsed', description: `${parsed.length} examples ready` });
      },
      error: () => {
        toast({ title: 'CSV error', description: 'Failed to parse CSV', variant: 'destructive' });
      }
    });
  };

  const handleSaveManual = useCallback(async () => {
    if (!selectedConcept) {
      toast({ title: 'Please select a concept', variant: 'destructive' });
      return;
    }
    const conceptNames = [selectedConcept.name];
    const newOnes: ConceptExample[] = manualExamples
      .filter(e => e.snippet.trim().length > 0)
      .map(e => ({
        id: crypto.randomUUID(),
        snippet: e.snippet.trim(),
        concepts: conceptNames,
        created_at: new Date().toISOString(),
      }));
    if (newOnes.length === 0) {
      toast({ title: 'Nothing to save', description: 'Add at least one valid example' });
      return;
    }
    const ok = await saveExamples([...(examples || []), ...newOnes]);
    if (ok) {
      try {
        const goals = newOnes.map(e => ({
          concept_id: selectedConcept.id!,
          goal_description: e.snippet,
          approved: manualApproved,
        }));
        const { data, error } = await supabase.functions.invoke('enrich-and-save-learning-goals', { body: { goals } });
        if (error) throw error;
        toast({ title: 'Learning goals updated', description: `${data?.inserted ?? 0} approved, ${data?.skipped_duplicates ?? 0} skipped as duplicates` });
      } catch (e: any) {
        toast({ title: 'Learning goals insert failed', description: e?.message || 'See logs', variant: 'destructive' });
      }
      navigate(`/admin/domain/${domainId}/ai-guidance/${area}`);
    }
  }, [selectedConcept, manualExamples, examples, saveExamples, navigate, domainId, area, toast, manualApproved]);

  const handleSaveBulk = useCallback(async () => {
    if (bulkExamples.length === 0) {
      toast({ title: 'No examples parsed', variant: 'destructive' });
      return;
    }
    const ok = await saveExamples([...(examples || []), ...bulkExamples]);
    if (ok) {
      try {
        const goals = bulkExamples.map(ex => {
          const cid = ex.concept_id || allConcepts.find(c => c.name === (ex.concepts?.[0] || ''))?.id;
          if (!cid) return null;
          return {
            concept_id: cid,
            goal_description: ex.snippet,
            bloom_level: ex.bloom_level ?? null,
            goal_type: ex.goal_type ?? null,
            sequence_order: ex.sequence_order ?? null,
            approved: ex.approved ?? true,
          };
        }).filter(Boolean);
        if ((goals as any[]).length > 0) {
          const { data, error } = await supabase.functions.invoke('enrich-and-save-learning-goals', { body: { goals } });
          if (error) throw error;
          toast({ title: 'Learning goals updated', description: `${data?.inserted ?? 0} approved, ${data?.skipped_duplicates ?? 0} skipped as duplicates` });
        }
      } catch (e: any) {
        toast({ title: 'Learning goals insert failed', description: e?.message || 'See logs', variant: 'destructive' });
      }
      navigate(`/admin/domain/${domainId}/ai-guidance/${area}`);
    }
  }, [bulkExamples, examples, saveExamples, navigate, domainId, area, toast, allConcepts]);

  return (
    <div className="p-6">
      {/* Breadcrumb Navigation */}
      <DynamicBreadcrumb />
      
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(`/admin/domain/${domainId}/ai-guidance/${area}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Examples
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Examples</h1>
          <p className="text-muted-foreground">{domainName} • {area}</p>
        </div>
        <div />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Select concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="Search concepts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </CardContent>
          </Card>

          <Separator className="my-6" />

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'manual' | 'bulk')}>
            <TabsList>
              <TabsTrigger value="manual">Add manually</TabsTrigger>
              <TabsTrigger value="bulk">Bulk upload</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {manualExamples.map((ex, idx) => (
                      <div key={idx} className="border rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Example #{idx + 1}</span>
                          {manualExamples.length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeManualRow(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Textarea
                          placeholder="Enter example snippet (text or code)"
                          value={ex.snippet}
                          onChange={(e) => setManualExamples(prev => prev.map((p, i) => i === idx ? { ...p, snippet: e.target.value } : p))}
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" onClick={addManualRow}>
                        <Plus className="h-4 w-4 mr-2" /> Add another
                      </Button>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2 mr-2">
                        <Checkbox id="manual-approved" checked={manualApproved} onCheckedChange={(v) => setManualApproved(Boolean(v))} />
                        <Label htmlFor="manual-approved" className="text-sm">Mark as approved in learning goals</Label>
                      </div>
                      <Button onClick={handleSaveManual}>
                        <Save className="h-4 w-4 mr-2" /> Save examples
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk upload via CSV</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" /> Download template
                      </Button>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => e.target.files && handleCsvUpload(e.target.files[0])}
                        />
                        <span className="inline-flex items-center gap-2 border rounded px-3 py-2">
                          <Upload className="h-4 w-4" /> Upload filled CSV
                        </span>
                      </label>
                    </div>

                    {bulkExamples.length > 0 && (
                      <div className="text-sm text-muted-foreground">{bulkExamples.length} examples parsed</div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={handleSaveBulk} disabled={bulkExamples.length === 0}>
                        <Save className="h-4 w-4 mr-2" /> Save examples
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky top-20 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[420px] overflow-auto">
                <RadioGroup value={selectedId ?? ''} onValueChange={(v) => setSelectedId(v)}>
                  {filteredConcepts.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value={c.id} id={`concept-${c.id}`} />
                      <label htmlFor={`concept-${c.id}`} className="text-sm leading-none cursor-pointer">
                        {c.name}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
                {filteredConcepts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No concepts found</p>
                )}
                {selectedConcept && (
                  <div className="mt-3">
                    <Badge variant="secondary">{selectedConcept.name}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default AddExamplesPage;
