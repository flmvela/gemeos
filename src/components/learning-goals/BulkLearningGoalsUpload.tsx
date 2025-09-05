import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Loader2, Download } from "lucide-react";

interface BulkLearningGoalsUploadProps {
  conceptId: string;
  onDone?: () => void;
}

export const BulkLearningGoalsUpload: React.FC<BulkLearningGoalsUploadProps> = ({ conceptId, onDone }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasData = rows.length > 0;

  const template = useMemo(() => (
    "concept_id,concept_name,goal_description,bloom_level,goal_type,sequence_order,approved\n" +
    ",,Describe chord progressions,Understand,Knowledge,1,yes\n" +
    ",,Analyze rhythmic patterns,Analyze,Knowledge,2,yes\n"
  ), []);

  const onSelect = (f: File | null) => {
    setFile(f);
    setRows([]);
    if (!f) return;
    setParsing(true);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data as any[]).filter(r => ((r.goal_description || '').toString().trim().length > 0) || r.concept_id || r.concept_name);
        setRows(data);
        setParsing(false);
      },
      error: (e) => {
        setParsing(false);
        toast({ title: "Parse failed", description: e.message, variant: "destructive" });
      }
    });
  };

  const onUpload = async () => {
    if (!hasData) return;
    setUploading(true);
    try {
      // Resolve domain and concept IDs if concept_name used
      const { data: baseConcept } = await supabase.from('concepts').select('id, domain_id').eq('id', conceptId).maybeSingle();
      let nameToId: Record<string, string> = {};
      if (baseConcept) {
        const anyNameRows = rows.some(r => r.concept_name && !r.concept_id);
        if (anyNameRows) {
          const { data: concepts } = await supabase.from('concepts').select('id, name').eq('domain_id', baseConcept.domain_id);
          (concepts || []).forEach((c: any) => { nameToId[c.name.toLowerCase()] = c.id; });
        }
      }

      const goals = rows.map(r => {
        const cid = (r.concept_id || '').toString().trim() || (r.concept_name ? nameToId[(r.concept_name || '').toString().trim().toLowerCase()] : '') || conceptId;
        const approvedStr = (r.approved ?? 'yes').toString().trim().toLowerCase();
        const seqRaw = (r.sequence_order ?? '').toString().trim();
        return {
          concept_id: cid,
          goal_description: String(r.goal_description || '').trim(),
          bloom_level: r.bloom_level ? String(r.bloom_level).trim() : null,
          goal_type: r.goal_type ? String(r.goal_type).trim() : null,
          sequence_order: seqRaw === '' ? null : Number(seqRaw),
          approved: ['yes','true','1','y'].includes(approvedStr),
        };
      }).filter((g: any) => g.goal_description && g.concept_id);

      const { data, error } = await supabase.functions.invoke("enrich-and-save-learning-goals", { body: { goals } });
      if (error) throw error;
      toast({ title: "Uploaded", description: `${data?.inserted ?? 0} inserted, ${data?.skipped_duplicates ?? 0} skipped as duplicates` });
      setOpen(false);
      setFile(null);
      setRows([]);
      onDone?.();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Bulk upload (CSV)</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk upload learning goals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv">CSV file</Label>
              <Input id="csv" type="file" accept=".csv" onChange={(e) => onSelect(e.target.files?.[0] || null)} />
              {parsing && <div className="text-xs text-muted-foreground flex items-center"><Loader2 className="h-3 w-3 mr-2 animate-spin"/>Parsing…</div>}
              {hasData && (
                <div className="text-xs text-muted-foreground">Parsed {rows.length} rows. Headers: concept_id, concept_name, goal_description, bloom_level, goal_type, sequence_order, approved</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>CSV template</Label>
              <pre className="p-3 rounded bg-muted text-xs overflow-auto">{template}</pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={onUpload} disabled={!hasData || uploading}>
              {uploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Uploading…</>) : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};