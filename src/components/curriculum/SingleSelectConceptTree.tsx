import React from "react";
import { Concept } from "@/hooks/useConcepts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

type TreeNode = Concept & { children: TreeNode[] };

function buildTree(concepts: Concept[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  concepts.forEach(c => {
    map.set(c.id, { ...c, children: [] });
  });

  const byOrder = (a: Concept, b: Concept) => {
    const ao = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.display_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  };

  concepts.sort(byOrder).forEach(c => {
    const node = map.get(c.id)!;
    const pid = c.parent_concept_id ?? null;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (list: TreeNode[]) => {
    list.sort(byOrder as any);
    list.forEach(n => sortChildren(n.children));
  };
  sortChildren(roots);

  return roots;
}

const levelColors = [
  "bg-violet-500", // L0
  "bg-emerald-500", // L1
  "bg-green-600",  // L2
  "bg-amber-500",  // L3
  "bg-red-500",    // L4
  "bg-rose-500",   // L5
  "bg-blue-600",   // L6
  "bg-indigo-600", // L7
];

function LevelDot({ level = 0 }: { level?: number | null }) {
  const idx = Math.max(0, Math.min(7, level ?? 0));
  const cls = levelColors[idx] || levelColors[0];
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

interface RowProps {
  node: TreeNode;
  depth: number;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  open: Set<string>;
  setOpen: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const Row: React.FC<RowProps> = ({ node, depth, selectedId, onSelect, open, setOpen }) => {
  const hasChildren = node.children.length > 0;
  const isOpen = open.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        role="button"
        onClick={() => onSelect(node.id)}
        className={`group flex items-start justify-between gap-2 rounded-md px-3 py-2 cursor-pointer transition-colors ${
          isSelected ? "bg-muted text-foreground border border-foreground/20" : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${(depth + 0.5) * 12}px` }}
      >
        <div className="flex items-start gap-2 min-w-0">
          {/* caret */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); const n = new Set(open); if (isOpen) n.delete(node.id); else n.add(node.id); setOpen(n); }}
              className="mt-0.5 text-muted-foreground hover:text-foreground"
              aria-label={isOpen ? "Collapse" : "Expand"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : "rotate-0"}`} />
            </button>
          ) : (
            <span className="h-4 w-4" />
          )}
          <div className="mt-0.5">
            <LevelDot level={node.difficulty_level ?? depth} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{node.name}</div>
            {node.description ? (
              <div className="text-xs text-muted-foreground truncate">
                {node.description}
              </div>
            ) : null}
          </div>
        </div>
        {hasChildren ? (
          <Badge variant="outline" className="text-[10px]">{node.children.length}</Badge>
        ) : null}
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children.map(child => (
            <Row
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              open={open}
              setOpen={setOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SingleSelectConceptTreeProps {
  concepts: Concept[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export const SingleSelectConceptTree: React.FC<SingleSelectConceptTreeProps> = ({ concepts, selectedId, onSelect }) => {
  const tree = React.useMemo(() => buildTree(concepts), [concepts]);
  const [open, setOpen] = React.useState<Set<string>>(new Set());

  const expandAll = () => {
    const all = new Set<string>();
    const walk = (n: TreeNode[]) => n.forEach(x => { all.add(x.id); walk(x.children); });
    walk(tree);
    setOpen(all);
  };

  const collapseAll = () => setOpen(new Set());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={expandAll}>Expand All</Button>
        <Button size="sm" variant="outline" onClick={collapseAll}>Collapse All</Button>
      </div>
      <div className="space-y-1">
        {tree.map(node => (
          <Row
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            open={open}
            setOpen={setOpen}
          />)
        )}
      </div>
    </div>
  );
};
