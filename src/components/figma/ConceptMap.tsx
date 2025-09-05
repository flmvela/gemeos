import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Concept } from "@/hooks/useConcepts";

interface ConceptMapProps {
  concepts: Concept[];
  selectedId: string | null;
  onSelect: (conceptId: string) => void;
}

type TreeNode = {
  id: string;
  name: string;
  level: number;
  description?: string | null;
  children: TreeNode[];
  childCount: number;
};

const levelColors = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-rose-500",
  "bg-blue-600",
  "bg-indigo-600",
];

export function ConceptMap({ concepts, selectedId, onSelect }: ConceptMapProps) {
  // Build tree structure from flat concepts
  const roots = useMemo<TreeNode[]>(() => {
    const byId = new Map<string, TreeNode>();
    const childrenMap = new Map<string | null, TreeNode[]>();

    concepts.forEach((c) => {
      byId.set(c.id, {
        id: c.id,
        name: c.name,
        level: (c as any).difficulty_level ?? 0,
        description: (c as any).description ?? null,
        children: [],
        childCount: 0,
      });
    });

    concepts.forEach((c: any) => {
      const parentId = c.parent_concept_id ?? null;
      const list = childrenMap.get(parentId) ?? [];
      list.push(byId.get(c.id)!);
      childrenMap.set(parentId, list);
    });

    // assign children
    byId.forEach((node, id) => {
      const children = childrenMap.get(id) ?? [];
      node.children = children;
      node.childCount = children.length;
    });

    // roots are those with parent_concept_id null
    const rootNodes = childrenMap.get(null) ?? [];

    // sort roots and children by level then name for consistency
    const sortTree = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
      nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(rootNodes);

    return rootNodes;
  }, [concepts]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((r) => r.id)));

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    const collect = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        all.add(n.id);
        if (n.children.length) collect(n.children);
      });
    };
    collect(roots);
    setExpanded(all);
  };

  const collapseAll = () => setExpanded(new Set());

  const getLevelColor = (level: number) => levelColors[level] ?? "bg-gray-500";

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
            isSelected ? "bg-muted" : ""
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => onSelect(node.id)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto w-4 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <ChevronRight className="h-4 w-4 opacity-0" />
          )}

          <div className={`w-3 h-3 rounded-full ${getLevelColor(node.level)}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`truncate ${isSelected ? "font-medium" : ""}`}>
                {node.name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                L{node.level}
              </span>
            </div>
            {node.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {node.description}
              </p>
            )}
          </div>

          {node.childCount > 0 && (
            <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              {node.childCount}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          <span className="font-medium">Music Theory Concepts</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Level Legend */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">Concept Levels:</p>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, level) => (
            <div key={level} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getLevelColor(level)}`} />
              <span className="text-sm text-muted-foreground">L{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 pr-2">{roots.map((r) => renderNode(r))}</div>
      </div>
    </div>
  );
}
