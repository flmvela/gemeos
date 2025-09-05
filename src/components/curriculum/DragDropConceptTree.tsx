import React, { useState } from 'react';
import { Tree } from '@minoru/react-dnd-treeview';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Trash2, Clock, BookOpen, Music, Target, Lightbulb, Wrench, GraduationCap, Star, AlertTriangle, Zap, ChevronRight, Edit2, Check, X, Plus, Link2, ListPlus } from 'lucide-react';
import { ConceptParentSelector } from './ConceptParentSelector';
import { DifficultyLabel } from '@/components/common/DifficultyLabel';
import { Concept } from '@/hooks/useConcepts';
import { useNavigate, useParams } from 'react-router-dom';

interface DragDropConceptTreeProps {
  concepts: Concept[];
  onConceptClick?: (concept: Concept) => void;
  onConceptReject?: (conceptId: string) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptParentChange?: (conceptId: string, parentId: string) => void;
  onConceptDelete?: (conceptId: string) => void;
  onConceptUpdate?: (conceptId: string, updates: Partial<Pick<Concept, 'name' | 'description'>>) => void;
  onMoveUp?: (conceptId: string) => void | Promise<void> | Promise<boolean>;
  onMoveDown?: (conceptId: string) => void | Promise<void> | Promise<boolean>;
  adminMode?: boolean;
  showRejected?: boolean;
  onInlineAdd?: (parentId: string) => Promise<string | undefined>;
  onStartLinking?: (concept: Concept) => void;
}


interface TreeNodeData extends Concept {
  droppable?: boolean;
}

export const DragDropConceptTree = ({
  concepts,
  onConceptClick,
  onConceptReject,
  onConceptApprove,
  onConceptParentChange,
  onConceptDelete,
  onConceptUpdate,
  onMoveUp,
  onMoveDown,
  adminMode = false,
  showRejected = false,
  onInlineAdd,
  onStartLinking
}: DragDropConceptTreeProps) => {
  const navigate = useNavigate();
  const { domainSlug } = useParams<{ domainSlug: string }>();
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [openIds, setOpenIds] = useState<(string | number)[]>(() => concepts.map(c => c.id) // Start with all nodes expanded
  );
  const newlyCreatedIds = React.useRef<Set<string>>(new Set());

  // DEBUG: Log concepts to help diagnose display issues
  React.useEffect(() => {
    console.log('🔍 DragDropConceptTree - Concepts received:', concepts.length);
    console.log('🔍 AI Suggested concepts:', concepts.filter(c => c.status === 'suggested').length);
    console.log('🔍 Suggested concepts details:', concepts.filter(c => c.status === 'suggested').map(c => ({
      id: c.id,
      name: c.name,
      parent_concept_id: c.parent_concept_id,
      status: c.status
    })));
  }, [concepts]);
  
  // New smart comparator for natural sorting
  const smartComparator = (a: Concept, b: Concept) => {
    // 1. Prioritize display_order if it exists
    const ao = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.display_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;

    // 2. Extract numeric prefix from name for natural sorting
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] || '0', 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] || '0', 10);

    if (numA !== numB) {
      return numA - numB;
    }

    // 3. Fallback to full name comparison
    return a.name.localeCompare(b.name);
  };


  // Build deterministic, depth-first tree data based on display_order within each parent
  const treeData = React.useMemo(() => {
    console.log('🌳 Building tree data from concepts:', concepts.length);

    // Group concepts by parent id (null => root) and index by id
    const groups = new Map<string | null, Concept[]>();
    const idSet = new Set<string>();
    for (const c of concepts) {
      idSet.add(c.id);
      const pid = c.parent_concept_id ?? null;
      if (!groups.has(pid)) groups.set(pid, []);
      groups.get(pid)!.push(c);
    }

    // Sort children within each group using the smart comparator
    groups.forEach((arr) => arr.sort(smartComparator));

    // Determine roots for this (possibly filtered) set: no parent or parent not present in the set
    const roots: Concept[] = concepts.filter((c) => !c.parent_concept_id || !idSet.has(c.parent_concept_id));

    const result: any[] = [];
    const pushNode = (node: Concept, parentId: string | null) => {
      result.push({
        id: node.id,
        parent: parentId ?? 0,
        droppable: true,
        text: node.name,
        data: node,
      });
      const children = groups.get(node.id) || [];
      for (const child of children) {
        pushNode(child, node.id);
      }
    };

    // Build forest from computed roots so nodes remain visible even when their parents are filtered out
    roots.sort(smartComparator).forEach((root) => pushNode(root, null));

    console.log(
      '🌳 Final flattened order sample:',
      result.slice(0, 10).map((n) => ({
        id: String(n.id).slice(0, 8),
        parent: n.parent === 0 ? 'root' : String(n.parent).slice(0, 8),
        name: n.data?.name,
        order: n.data?.display_order,
      }))
    );

    return result;
  }, [concepts]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: CheckCircle,
          label: 'Approved'
        };
      case 'suggested':
        return {
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          icon: Lightbulb,
          label: 'AI Suggested'
        };
      case 'rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          label: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: Clock,
          label: 'Pending'
        };
    }
  };
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'theoretical':
        return BookOpen;
      case 'practical':
        return Target;
      case 'technical':
        return Wrench;
      case 'stylistic':
        return Star;
      case 'performance':
        return Music;
      case 'educational':
        return GraduationCap;
      case 'advanced':
        return Zap;
      case 'warning':
        return AlertTriangle;
      default:
        return BookOpen;
    }
  };
  const handleEditStart = (conceptId: string, currentName: string) => {
    setEditingConcept(conceptId);
    setEditValue(currentName);
  };
  const handleEditSave = async (conceptId: string) => {
    if (editValue.trim() && editValue !== concepts.find(c => c.id === conceptId)?.name) {
      await onConceptUpdate?.(conceptId, {
        name: editValue.trim()
      });
    }
    // If this was a newly created placeholder, clear the flag
    if (newlyCreatedIds.current.has(conceptId)) {
      newlyCreatedIds.current.delete(conceptId);
    }
    setEditingConcept(null);
    setEditValue('');
  };
  const handleEditCancel = async () => {
    const id = editingConcept;
    setEditingConcept(null);
    setEditValue('');
    if (id && newlyCreatedIds.current.has(id)) {
      // Delete the placeholder concept if user cancels creation
      await onConceptDelete?.(id);
      newlyCreatedIds.current.delete(id);
    }
  };
  const handleToggle = (id: string | number) => {
    setOpenIds(prev => prev.includes(id) ? prev.filter(openId => openId !== id) : [...prev, id]);
  };
  const getChildCount = (parentId: string) => {
    return concepts.filter(c => c.parent_concept_id === parentId).length;
  };

  const handleInlineAdd = async (parentId: string) => {
    if (!onInlineAdd) return;
    // Ensure parent stays expanded
    setOpenIds(prev => (prev.includes(parentId) ? prev : [...prev, parentId]));
    const newId = await onInlineAdd(parentId);
    if (newId) {
      newlyCreatedIds.current.add(newId);
      setEditingConcept(newId);
      setEditValue('New Concept');
    }
  };

  const Node = ({
    node,
    depth,
    isOpen,
    onToggle
  }: any) => {
    const concept: Concept = node.data;
    const statusConfig = getStatusConfig(concept.status);
    const TypeIcon = getTypeIcon(concept.metadata?.type);
    const hasChildren = getChildCount(concept.id) > 0;
    const childCount = getChildCount(concept.id);
    const level = concept.difficulty_level ?? 0;
    const levelBadgeClasses = [
      'bg-green-100 text-green-800 border-green-200',  // L0 - Green
      'bg-yellow-100 text-yellow-800 border-yellow-200', // L1 - Yellow
      'bg-orange-100 text-orange-800 border-orange-200', // L2 - Orange
      'bg-red-100 text-red-800 border-red-200', // L3 - Red
    ][level % 4] || 'bg-gray-100 text-gray-800 border-gray-200';

    // REMOVED: Sibling position logic is no longer needed

    return <div style={{
      marginLeft: depth * 24
    }}>
        <Card className={`transition-all duration-200 hover:shadow-md ${
          concept.status === 'suggested' 
            ? 'ring-2 ring-yellow-300 bg-yellow-50/30 border-yellow-200' 
            : concept.status === 'rejected'
            ? 'ring-2 ring-red-200 bg-red-50/30 border-red-200 opacity-60'
            : ''
        } ${depth > 0 ? 'border-l-2 border-muted' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
            {/* Expand/collapse toggle and drag handle */}
            <div className="flex items-center gap-1">
              {hasChildren ? <button
                  onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                  className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  aria-label={isOpen ? 'Collapse concept' : 'Expand concept'}
                >
                  <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button> : <div className="h-6 w-6" /> // Spacer for alignment
              }
              
            </div>

            {/* Status indicator for suggested concepts */}
            {concept.status === 'suggested' && (
              <div className="flex-shrink-0 pt-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" title="AI Suggested - Needs Review" />
              </div>
            )}

            {/* Main content */}
            <div
              className="flex-1 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => onToggle(node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(node.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Concept info */}
                <div className="flex-1 min-w-0">
                  {/* Concept header with edit functionality */}
                  <div className="flex items-center gap-2 min-w-0 flex-1 mb-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    
                    {/* Concept name - editable in admin mode */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {editingConcept === concept.id ? <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                          <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-sm flex-1" autoFocus onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleEditSave(concept.id);
                          } else if (e.key === 'Escape') {
                            handleEditCancel();
                          }
                        }} />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" onClick={() => handleEditSave(concept.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={handleEditCancel}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div> : <>
                          {/* REMOVED: Badge and Up/Down Buttons */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`font-medium ${!adminMode ? 'text-blue-600 hover:text-blue-700' : ''}`}>
                              {concept.name}
                              {hasChildren && <span className="text-muted-foreground"> - {childCount} child{childCount !== 1 ? 'ren' : ''}</span>}
                            </span>
                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${levelBadgeClasses}`}>L{level}</Badge>
                          </div>
                        </>}
                    </div>
                  </div>

                  {/* Description */}
                  {concept.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {concept.description}
                    </p>}

                  {/* Status and metadata badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(concept.status !== 'approved' && concept.status !== 'confirmed') && (
                      <Badge className={statusConfig.color}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    )}
                    
                    <DifficultyLabel 
                      level={concept.difficulty_level} 
                      domainId={concept.domain_id}
                      showLevelPrefix={false}
                      className="text-xs"
                    />

                    {concept.metadata?.type && <Badge variant="outline" className="text-xs">
                        {concept.metadata.type}
                      </Badge>}
                  </div>
                </div>

                {/* Actions */}
                {adminMode && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    {/* Edit button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => navigate(`/admin/domain/${domainSlug}/concepts/${concept.id}`)}
                      title="Open concept details"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>


                    {/* Add sub-concept */}
                    {onInlineAdd && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                        onClick={() => handleInlineAdd(concept.id)}
                        title="Add sub-concept"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* Parent selector */}
                    <ConceptParentSelector
                      currentConcept={concept}
                      availableParents={concepts}
                      onParentChange={onConceptParentChange!}
                    />

                    {/* Link concept */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onStartLinking?.(concept)}
                      title="Link this concept"
                    >
                      <Link2 className="h-3 w-3" />
                    </Button>

                    {/* Create learning goals */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/admin/domain/${domainSlug}/goals?conceptId=${concept.id}`)}
                      title="Create learning goals"
                    >
                      <ListPlus className="h-3 w-3" />
                    </Button>
                    
                    {/* Show approve/reject buttons for non-approved concepts */}
                    {concept.status !== 'approved' && concept.status !== 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onConceptApprove?.(concept.id)}
                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Approve concept"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onConceptReject?.(concept.id)}
                          className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Reject concept"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    {/* Delete button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConceptDelete?.(concept.id)}
                      className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete concept"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>;
  };

  if (concepts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
        <p>No concepts found.</p>
        <p className="text-xs mt-2">Debug: Received {concepts.length} concepts</p>
      </div>;
  }

  // DEBUG: Show debugging info when in admin mode
  const debugInfo = adminMode;
  return <DndProvider backend={HTML5Backend}>
      <div className="space-y-2">
        {debugInfo}
        <Tree tree={treeData} rootId={0} render={(node, {
      depth,
      hasChild,
      isOpen,
      onToggle
    }) => <Node node={node} depth={depth} isOpen={isOpen} onToggle={onToggle} />} onDrop={() => {}} canDrag={() => false} classes={{
      root: "space-y-1",
      draggingSource: "opacity-50",
      dropTarget: "bg-blue-50 border-2 border-blue-200 border-dashed rounded-md"
    }} />
      </div>
    </DndProvider>;
};