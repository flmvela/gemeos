
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

type Props = {
  concepts: Concept[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
};

type TreeNode = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  children: TreeNode[];
};

function buildTree(concepts: Concept[]): TreeNode[] {
  const byParent = new Map<string | null, Concept[]>();
  for (const c of concepts) {
    const pid = c.parent_concept_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  // sort siblings by display_order then name
  byParent.forEach(arr => arr.sort((a, b) => {
    const ao = a.display_order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.display_order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  }));

  const toNode = (c: Concept): TreeNode => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    children: (byParent.get(c.id) || []).map(toNode),
  });

  return (byParent.get(null) || []).map(toNode);
}

const Row: React.FC<{
  node: TreeNode;
  depth: number;
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
}> = ({ node, depth, selectedIds, onToggle }) => {
  const [open, setOpen] = React.useState(true);
  const hasChildren = node.children.length > 0;
  const checked = selectedIds.has(node.id);

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <Card className={`transition-all ${depth > 0 ? 'border-l-2 border-muted' : ''}`}>
        <CardContent className="py-2 px-3">
          <div className="flex items-start gap-2">
            <button
              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded"
              onClick={() => setOpen(o => !o)}
              title={open ? 'Collapse' : 'Expand'}
            >
              {hasChildren ? <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`} /> : <span className="inline-block w-4" />}
            </button>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={checked}
              onChange={(e) => onToggle(node.id, e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{node.name}</span>
                {node.status && (
                  <Badge variant="outline" className="text-xs capitalize">{node.status}</Badge>
                )}
              </div>
              {node.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{node.description}</p>}
            </div>
          </div>
          {open && hasChildren && (
            <div className="mt-2 space-y-1">
              {node.children.map(child => (
                <Row
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  selectedIds={selectedIds}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const SelectableConceptTree: React.FC<Props> = ({ concepts, selectedIds, onToggleSelect }) => {
  const tree = React.useMemo(() => buildTree(concepts), [concepts]);

  return (
    <div className="space-y-2">
      {tree.map(root => (
        <Row
          key={root.id}
          node={root}
          depth={0}
          selectedIds={selectedIds}
          onToggle={onToggleSelect}
        />
      ))}
    </div>
  );
};
