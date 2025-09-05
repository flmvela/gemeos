import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/concept-detail/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Save, BookOpen, GitBranch, BarChart3, Edit3, Pencil, Plus, Check, X, Link2, Search } from "lucide-react";
import type { Concept } from "@/hooks/useConcepts";
import type { LearningGoal } from "@/hooks/useLearningGoals";
import { DynamicBreadcrumb } from "@/components/navigation/DynamicBreadcrumb";
import { ConceptDetail } from "@/components/curriculum/ConceptDetail";
import { PageContainer } from "@/components/layout/PageContainer";

interface RelationshipRow {
  concept_a_id: string;
  concept_b_id: string;
  relationship_type: string;
  created_at?: string;
}

export default function ConceptDetailPage() {
  const { domainSlug, conceptId } = useParams<{ domainSlug: string; conceptId: string }>();
  const navigate = useNavigate();
  const domainId = domainSlug || "";
  const { toast } = useToast();

  const [concept, setConcept] = useState<Concept | null>(null);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRow[]>([]);

  const [relOpen, setRelOpen] = useState(false);
  const [relTargetId, setRelTargetId] = useState<string>("");
  const [relSearch, setRelSearch] = useState("");
  const [relType, setRelType] = useState<string>("is_related_to");

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [relSearchTerm, setRelSearchTerm] = useState("");
  useEffect(() => {
    const run = async () => {
      if (!conceptId) {
        console.error("No conceptId provided");
        return;
      }
      
      console.log("Fetching concept with ID:", conceptId);
      console.log("Domain ID:", domainId);
      
      // Fetch concept
      const { data: cData, error: cErr } = await (supabase as any)
        .from("concepts")
        .select("id,name,description,parent_concept_id,domain_id,status,difficulty_level,generation_source,source,source_file_id,created_at,updated_at,display_order,metadata,created_by,updated_by,reviewed_by,reviewed_at")
        .eq("id", conceptId)
        .single();
      
      if (cErr) {
        console.error("Concept fetch error:", cErr);
        console.error("Error details:", {
          code: cErr.code,
          message: cErr.message,
          details: cErr.details,
          hint: cErr.hint
        });
        toast({ 
          title: "Failed to load concept", 
          description: cErr.message || "Unknown error occurred",
          variant: "destructive" 
        });
        return;
      }
      
      console.log("Successfully fetched concept:", cData);
      setConcept(cData);
      setDescription(cData?.description || "");
      setTempDescription(cData?.description || "");
      document.title = `${cData?.name} – Concept Details`;
      // SEO meta description and canonical
      const desc = cData?.description ? String(cData.description).slice(0, 150) : "Concept detail workspace";
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = `${cData?.name} – ${desc}`;
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = window.location.href;
      // Fetch all concepts in domain (for dropdowns and names)
      if (domainId) {
        const { data: all, error: allErr } = await (supabase as any)
          .from("concepts")
          .select("id,name,description,parent_concept_id,domain_id,status,difficulty_level,generation_source,source,source_file_id,created_at,updated_at,display_order,metadata,created_by,updated_by,reviewed_by,reviewed_at")
          .eq("domain_id", domainId);
        if (!allErr) setAllConcepts(all || []);
      }

      // Fetch learning goals for this concept
      const { data: gData, error: gErr } = await (supabase as any)
        .from("learning_goals")
        .select("id, concept_id, goal_description, bloom_level, goal_type, sequence_order, status, created_at, metadata_json, created_by, updated_by, updated_at, review_status, reviewed_by, reviewed_at")
        .eq("concept_id", conceptId)
        .order("created_at", { ascending: false });
      if (!gErr) setGoals(gData || []);

      // Fetch relationships for this concept
      const { data: rData, error: rErr } = await (supabase as any)
        .from("concept_relationships")
        .select("id, domain_id, concept_a_id, concept_b_id, relationship_type, relationship_kind, metadata, created_at, status, source, created_by, updated_at")
        .or(`concept_a_id.eq.${conceptId},concept_b_id.eq.${conceptId}`);
      if (!rErr) setRelationships(rData || []);
    };
    run();
  }, [conceptId, domainId, toast]);

  const otherConcepts = useMemo(() => allConcepts.filter(c => c.id !== conceptId), [allConcepts, conceptId]);

  const relatedName = (row: RelationshipRow) => {
    const otherId = row.concept_a_id === conceptId ? row.concept_b_id : row.concept_a_id;
    return allConcepts.find(c => c.id === otherId)?.name || otherId;
  };

  const saveChanges = async () => {
    if (!conceptId) return;
    setIsSaving(true);
    const { error } = await (supabase as any)
      .from("concepts")
      .update({ description })
      .eq("id", conceptId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Failed to save changes", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Changes saved" });
  };

  const approveGoal = async (id: string) => {
    const { error } = await (supabase as any).from("learning_goals").update({ status: "approved" }).eq("id", id);
    if (!error) setGoals(prev => prev.map(g => (g.id === id ? { ...g, status: "approved" } : g)));
  };
  const rejectGoal = async (id: string) => {
    const { error } = await (supabase as any).from("learning_goals").update({ status: "rejected" }).eq("id", id);
    if (!error) setGoals(prev => prev.map(g => (g.id === id ? { ...g, status: "rejected" } : g)));
  };
  const editGoal = async (id: string, goal_description: string) => {
    const { error } = await (supabase as any).from("learning_goals").update({ goal_description }).eq("id", id);
    if (!error) setGoals(prev => prev.map(g => (g.id === id ? { ...g, goal_description } : g)));
  };

  const addRelationship = async () => {
    if (!conceptId || !relTargetId || relTargetId === conceptId) return;
    const { error } = await (supabase as any).from("concept_relationships").insert([
      { 
        domain_id: domainId,
        concept_a_id: conceptId, 
        concept_b_id: relTargetId, 
        relationship_type: relType,
        relationship_kind: 'related_to',
        metadata: {},
        status: 'active',
        // source: 'manual' // Field may not exist in database
      },
    ]);
    if (error) {
      toast({ title: "Failed to add relationship", description: error.message, variant: "destructive" });
      return;
    }
    setRelOpen(false);
    setRelTargetId("");
    setRelSearch("");
    const { data } = await (supabase as any)
      .from("concept_relationships")
      .select("id, domain_id, concept_a_id, concept_b_id, relationship_type, relationship_kind, metadata, created_at, status, source, created_by, updated_at")
      .or(`concept_a_id.eq.${conceptId},concept_b_id.eq.${conceptId}`);
    setRelationships(data || []);
    toast({ title: "Relationship added" });
  };

  const changeParent = async (newParentId: string | "none") => {
    if (!conceptId) return;
    const parentId = newParentId === "none" ? null : newParentId;
    const { error } = await (supabase as any)
      .from("concepts")
      .update({ parent_concept_id: parentId })
      .eq("id", conceptId);
    if (error) {
      toast({ title: "Failed to change parent", description: error.message, variant: "destructive" });
      return;
    }
    setConcept(prev => (prev ? { ...prev, parent_concept_id: parentId || undefined } as Concept : prev));
    toast({ title: "Parent updated" });
  };

  const changeDifficulty = async (newDifficulty: string) => {
    if (!conceptId) return;
    // Update difficulty level in the database
    const difficultyLevel = newDifficulty === 'beginner' ? 1 : 
                           newDifficulty === 'intermediate' ? 2 : 
                           newDifficulty === 'advanced' ? 3 : 
                           newDifficulty === 'expert' ? 4 : 0;
    const { error } = await (supabase as any)
      .from("concepts")
      .update({ difficulty_level: difficultyLevel })
      .eq("id", conceptId);
    if (error) {
      toast({ title: "Failed to change difficulty", description: error.message, variant: "destructive" });
      return;
    }
    setConcept(prev => (prev ? { ...prev, difficulty_level: difficultyLevel } as Concept : prev));
    toast({ title: "Difficulty updated" });
  };

  const handleSaveDescription = async () => {
    if (!conceptId) return;
    setIsSaving(true);
    const newDesc = tempDescription;
    const { error } = await (supabase as any)
      .from("concepts")
      .update({ description: newDesc })
      .eq("id", conceptId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Failed to save changes", description: error.message, variant: "destructive" });
      return;
    }
    setDescription(newDesc);
    setIsEditingDescription(false);
    toast({ title: "Changes saved" });
  };

  const handleCancelEdit = () => {
    setTempDescription(description);
    setIsEditingDescription(false);
  };

  const handleUpdateConcept = async (conceptId: string, updates: Partial<Concept>) => {
    const { error } = await (supabase as any)
      .from("concepts")
      .update(updates)
      .eq("id", conceptId);
    
    if (error) {
      toast({ title: "Failed to update concept", description: error.message, variant: "destructive" });
      return;
    }
    
    setConcept(prev => prev ? { ...prev, ...updates } : prev);
    toast({ title: "Concept updated successfully" });
  };

  const handleChangeParent = async (childId: string, newParentId?: string) => {
    const { error } = await (supabase as any)
      .from("concepts")
      .update({ parent_concept_id: newParentId || null })
      .eq("id", childId);
    
    if (error) {
      toast({ title: "Failed to change parent", description: error.message, variant: "destructive" });
      return;
    }
    
    // Refresh all concepts to reflect the change
    if (domainId) {
      const { data: all, error: allErr } = await (supabase as any)
        .from("concepts")
        .select("id,name,description,parent_concept_id,domain_id,status,difficulty_level,generation_source,source,source_file_id,created_at,updated_at,display_order,metadata,created_by,updated_by,reviewed_by,reviewed_at")
        .eq("domain_id", domainId);
      if (!allErr) setAllConcepts(all || []);
    }
    
    toast({ title: "Parent relationship updated" });
  };

  const handleNavigateToConcept = (conceptId: string) => {
    navigate(`/admin/domain/${domainSlug}/concepts/${conceptId}`);
  };

  if (!concept) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Loading…</h1>
        </div>
      </div>
    );
  }

  // Legacy code kept for potential future use
  const approvedGoals = goals.filter(g => g.status === "approved");
  const suggestedGoals = goals.filter(g => g.status === "suggested");
  const filteredRelationships = relationships.filter(r => {
    const name = relatedName(r).toLowerCase();
    const type = r.relationship_type.toLowerCase();
    const q = relSearchTerm.toLowerCase();
    return !q || name.includes(q) || type.includes(q);
  });

  return (
    <PageContainer>
      <DynamicBreadcrumb />
      <ConceptDetail
        concept={concept}
        concepts={allConcepts}
        onBack={() => navigate(-1)}
        onUpdateConcept={handleUpdateConcept}
        onChangeParent={handleChangeParent}
        onNavigateToConcept={handleNavigateToConcept}
      />
    </PageContainer>
  );
}

function GoalItem({ goal, onApprove, onReject, onEdit }: {
  goal: LearningGoal;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  onEdit: (id: string, desc: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(goal.goal_description);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1 pr-2 min-w-0">
          <CardTitle className="text-base font-medium truncate">{goal.goal_description}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {goal.bloom_level ? <Badge variant="outline">{goal.bloom_level}</Badge> : null}
            {goal.sequence_order != null ? <Badge variant="outline">#{goal.sequence_order}</Badge> : null}
            <Badge variant="outline">{goal.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {goal.status !== 'approved' && (
            <Button size="icon" variant="outline" onClick={() => onApprove(goal.id)} aria-label="Approve goal">
              <Check className="h-4 w-4" />
            </Button>
          )}
          {goal.status !== 'rejected' && (
            <Button size="icon" variant="outline" onClick={() => onReject(goal.id)} aria-label="Reject goal">
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit goal">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Textarea value={text} onChange={e => setText(e.target.value)} className="min-h-[120px]" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={async () => { await onEdit(goal.id, text); setEditing(false); }}>
                <Check className="h-4 w-4 mr-2"/>Save
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
