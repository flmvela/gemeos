import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Concept } from "@/hooks/useConcepts";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddLearningGoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concepts: Concept[]; // should be only approved concepts passed in
  onSubmitted?: () => void; // refresh callback
}

export const AddLearningGoalsModal: React.FC<AddLearningGoalsModalProps> = ({
  open,
  onOpenChange,
  concepts,
  onSubmitted,
}) => {
  const { toast } = useToast();
  const [conceptId, setConceptId] = useState<string>("");
  const [goalsText, setGoalsText] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(() => concepts.map(c => ({ id: c.id, name: c.name })).sort((a,b) => a.name.localeCompare(b.name)), [concepts]);

  const canSubmit = conceptId && goalsText.trim().length > 0;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("enrich-and-save-learning-goals", {
        body: {
          concept_id: conceptId,
          goals_text: goalsText,
        },
      });
      if (error) throw error;
      toast({ title: "Learning goals saved", description: "AI enriched details have been added and stored." });
      onOpenChange(false);
      setGoalsText("");
      setConceptId("");
      onSubmitted?.();
    } catch (e: any) {
      toast({ title: "Failed to save goals", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Learning Goals</DialogTitle>
          <DialogDescription>
            Select a parent concept and paste one learning goal per line. We'll automatically enrich them with Bloom's level, goal type, and sequence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concept">Parent Concept</Label>
            <Select value={conceptId} onValueChange={setConceptId}>
              <SelectTrigger id="concept">
                <SelectValue placeholder="Choose a concept" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goal Descriptions</Label>
            <Textarea
              id="goals"
              placeholder="Enter one learning goal per line..."
              className="min-h-[180px]"
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Each line will be saved as a separate goal.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!canSubmit || saving}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Saving...</>) : "Save and Generate Details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};