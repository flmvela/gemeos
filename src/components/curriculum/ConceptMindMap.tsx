import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeOrigin,
  OnConnect,
  Panel,
  useReactFlow,
  Handle,
  Position,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, ZoomIn, RotateCcw } from 'lucide-react';
import { Concept } from '@/hooks/useConcepts';

interface ConceptMindMapProps {
  concepts: Concept[];
  onConceptClick?: (concept: Concept) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptReject?: (conceptId: string) => void;
  onConceptParentChange?: (conceptId: string, parentId: string) => void;
  saveMindmapPosition?: (conceptId: string, x: number, y: number) => Promise<boolean>;
  getMindmapPosition?: (conceptId: string) => { x: number; y: number } | null;
  onResetLayout?: () => Promise<boolean>;
}

interface MindMapNodeData extends Record<string, unknown> {
  concept: Concept;
  level: number;
  onConceptClick?: (concept: Concept) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptReject?: (conceptId: string) => void;
}

const nodeOrigin: NodeOrigin = [0.5, 0.5];

// Custom node component for mindmap style
const MindMapNode = ({ data }: { data: MindMapNodeData }) => {
  const { concept, level, onConceptClick, onConceptApprove, onConceptReject } = data;
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'bg-green-100 border-green-300 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-100 border-red-300 text-red-800', icon: XCircle };
      case 'suggested':
        return { color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: null };
      default:
        return { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: null };
    }
  };

  const getLevelConfig = (level: number) => {
    const colors = [
      'border-l-purple-500', // Root level
      'border-l-blue-500',   // Level 1
      'border-l-green-500',  // Level 2
      'border-l-orange-500', // Level 3
      'border-l-pink-500',   // Level 4+
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const statusConfig = getStatusConfig(concept.status);
  const levelConfig = getLevelConfig(level);
  const isRoot = level === 0;

  return (
    <>
      {/* Parent connection handle - only for non-root nodes */}
      {level > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          id="parent"
          className="w-3 h-3 border-2 border-primary bg-background hover:bg-primary hover:border-primary-foreground transition-colors"
          style={{ top: -6 }}
        />
      )}
      
      {/* Child connection handles - for all nodes that can have children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="child-bottom"
        className="w-3 h-3 border-2 border-blue-500 bg-background hover:bg-blue-500 hover:border-blue-600 transition-colors"
        style={{ bottom: -6 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="child-left"
        className="w-3 h-3 border-2 border-blue-500 bg-background hover:bg-blue-500 hover:border-blue-600 transition-colors"
        style={{ left: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="child-right"
        className="w-3 h-3 border-2 border-blue-500 bg-background hover:bg-blue-500 hover:border-blue-600 transition-colors"
        style={{ right: -6 }}
      />

      <Card 
        className={`
          ${statusConfig.color} ${levelConfig}
          border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md
          ${isRoot ? 'min-w-40 font-semibold' : 'min-w-32'}
          max-w-48 p-3 relative
        `}
        onClick={() => onConceptClick?.(concept)}
      >
        <div className="space-y-2">
          <div className={`${isRoot ? 'text-base' : 'text-sm'} font-medium break-words`}>
            {concept.name}
          </div>
          
          {concept.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {concept.description}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Level {level}
            </Badge>
            
            {concept.status === 'suggested' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-green-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConceptApprove?.(concept.id);
                  }}
                >
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConceptReject?.(concept.id);
                  }}
                >
                  <XCircle className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};

const nodeTypes = {
  mindMapNode: MindMapNode,
};

// Helper function to calculate radial layout
const getRadialPosition = (
  centerX: number,
  centerY: number,
  radius: number,
  angle: number
) => ({
  x: centerX + radius * Math.cos(angle),
  y: centerY + radius * Math.sin(angle),
});

// Convert concepts to mindmap nodes and edges
const convertConceptsToMindMap = (
  concepts: Concept[],
  onConceptClick?: (concept: Concept) => void,
  onConceptApprove?: (conceptId: string) => void,
  onConceptReject?: (conceptId: string) => void,
  getMindmapPosition?: (conceptId: string) => { x: number; y: number } | null
) => {
  const nodes: Node<MindMapNodeData>[] = [];
  const edges: Edge[] = [];
  
  // Build hierarchy
  const conceptMap = new Map(concepts.map(c => [c.id, c]));
  const children = new Map<string, Concept[]>();
  const roots: Concept[] = [];
  
  concepts.forEach(concept => {
    if (!concept.parent_concept_id) {
      roots.push(concept);
    } else {
      if (!children.has(concept.parent_concept_id)) {
        children.set(concept.parent_concept_id, []);
      }
      children.get(concept.parent_concept_id)!.push(concept);
    }
  });

  // Position nodes in radial layout
  const positionedNodes = new Map<string, { x: number; y: number; level: number }>();
  
  const positionSubtree = (
    rootConcept: Concept,
    centerX: number,
    centerY: number,
    level: number,
    startAngle: number,
    endAngle: number,
    radius: number
  ) => {
    // Position root
    positionedNodes.set(rootConcept.id, { x: centerX, y: centerY, level });
    
    const conceptChildren = children.get(rootConcept.id) || [];
    if (conceptChildren.length === 0) return;
    
    // Calculate positions for children
    const angleStep = (endAngle - startAngle) / Math.max(conceptChildren.length, 1);
    const childRadius = radius + 150; // Distance between levels
    
    conceptChildren.forEach((child, index) => {
      const angle = startAngle + (index + 0.5) * angleStep;
      const childPos = getRadialPosition(centerX, centerY, childRadius, angle);
      
      // Recursively position subtree
      const childStartAngle = angle - angleStep * 0.4;
      const childEndAngle = angle + angleStep * 0.4;
      
      positionSubtree(
        child,
        childPos.x,
        childPos.y,
        level + 1,
        childStartAngle,
        childEndAngle,
        childRadius
      );
    });
  };

  // Position each root and its subtree
  if (roots.length === 1) {
    // Single root - center it
    positionSubtree(roots[0], 400, 300, 0, 0, Math.PI * 2, 100);
  } else {
    // Multiple roots - distribute them around a circle
    roots.forEach((root, index) => {
      const angle = (index / roots.length) * Math.PI * 2;
      const rootPos = getRadialPosition(400, 300, 150, angle);
      const startAngle = angle - Math.PI / roots.length;
      const endAngle = angle + Math.PI / roots.length;
      
      positionSubtree(root, rootPos.x, rootPos.y, 0, startAngle, endAngle, 100);
    });
  }

  // Create nodes
  concepts.forEach(concept => {
    const position = positionedNodes.get(concept.id);
    if (position) {
      // Check for saved position first
      const savedPosition = getMindmapPosition?.(concept.id);
      const nodePosition = savedPosition || { x: position.x, y: position.y };
      
      console.log('🎯 Creating node for concept:', concept.id, 'savedPosition:', JSON.stringify(savedPosition), 'finalPosition:', JSON.stringify(nodePosition));
      
      nodes.push({
        id: concept.id,
        type: 'mindMapNode',
        position: nodePosition,
        data: {
          concept,
          level: position.level,
          onConceptClick,
          onConceptApprove,
          onConceptReject,
        },
        draggable: true,
      });
    }
  });

  // Create edges
  concepts.forEach(concept => {
    if (concept.parent_concept_id && 
        concept.parent_concept_id.trim() !== '' && 
        conceptMap.has(concept.parent_concept_id) &&
        positionedNodes.has(concept.parent_concept_id) &&
        positionedNodes.has(concept.id)) {
      edges.push({
        id: `${concept.parent_concept_id}-${concept.id}`,
        source: concept.parent_concept_id,
        target: concept.id,
        type: 'smoothstep',
        style: {
          stroke: concept.status === 'approved' ? '#10b981' : 
                  concept.status === 'rejected' ? '#ef4444' : 
                  concept.status === 'suggested' ? '#f59e0b' : '#6b7280',
          strokeWidth: 2,
        },
        animated: concept.status === 'suggested',
      });
    }
  });

  return { nodes, edges };
};

export const ConceptMindMap = ({
  concepts,
  onConceptClick,
  onConceptApprove,
  onConceptReject,
  onConceptParentChange,
  saveMindmapPosition,
  getMindmapPosition,
  onResetLayout,
}: ConceptMindMapProps) => {
  const { nodes: initialNodes, edges: initialEdges } = convertConceptsToMindMap(
    concepts,
    onConceptClick,
    onConceptApprove,
    onConceptReject,
    getMindmapPosition
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced save function
  const debouncedSave = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Track when nodes are manually moved and save to database
  const handleNodesChange = useCallback((changes: any[]) => {
    console.log('🎯 ALL node changes:', changes);
    
    changes.forEach(change => {
      console.log('🎯 Processing change type:', change.type, 'change:', change);
      
      // Check for drag end - when dragging stops
      if (change.type === 'position' && change.dragging === false && saveMindmapPosition) {
        const nodeId = change.id;
        const newPosition = change.position;
        console.log('🎯 DRAG ENDED for node:', nodeId, 'at position:', newPosition);
        
        // Clear existing timeout
        if (debouncedSave.current[nodeId]) {
          clearTimeout(debouncedSave.current[nodeId]);
        }
        
        // Set timeout to save position
        debouncedSave.current[nodeId] = setTimeout(async () => {
          console.log('🎯 Attempting to save position for:', nodeId, 'at:', newPosition);
          setIsLoading(true);
          const success = await saveMindmapPosition(nodeId, newPosition.x, newPosition.y);
          console.log('🎯 Save result:', success);
          setIsLoading(false);
          delete debouncedSave.current[nodeId];
        }, 500);
      } else if (change.type === 'position') {
        console.log('🎯 Position change but still dragging:', change.dragging);
      }
    });
    
    onNodesChange(changes);
  }, [onNodesChange, saveMindmapPosition]);

  // Update nodes and edges when concepts change
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertConceptsToMindMap(
      concepts,
      onConceptClick,
      onConceptApprove,
      onConceptReject,
      getMindmapPosition
    );
    
    // Merge live positions with calculated positions to preserve manual moves
    const currentPositions = new Map(nodes.map(n => [n.id, n.position]));
    const mergedNodes = newNodes.map(newNode => {
      const currentPosition = currentPositions.get(newNode.id);
      // If we have a current position for this node, keep it (preserves manual moves)
      // Otherwise, use the calculated position (for new nodes or layout resets)
      const position = currentPosition || newNode.position;
      
      console.log('🎯 Merging node:', newNode.id, 'current:', JSON.stringify(currentPosition), 'calculated:', JSON.stringify(newNode.position), 'final:', JSON.stringify(position));
      
      return {
        ...newNode,
        position
      };
    });
    
    console.log('🎯 Updating nodes due to concepts change - preserving live positions');
    setNodes(mergedNodes);
    setEdges(newEdges);
  }, [concepts, onConceptClick, onConceptApprove, onConceptReject, getMindmapPosition]);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    if (params.source && params.target && onConceptParentChange) {
      // Prevent self-connections
      if (params.source === params.target) {
        console.warn('Cannot connect a node to itself');
        return;
      }
      
      // Prevent circular dependencies by checking if target is already an ancestor of source
      const isCircular = (sourceId: string, targetId: string, visited = new Set<string>()): boolean => {
        if (visited.has(sourceId)) return false;
        visited.add(sourceId);
        
        const sourceConcept = concepts.find(c => c.id === sourceId);
        if (!sourceConcept || !sourceConcept.parent_concept_id) return false;
        
        if (sourceConcept.parent_concept_id === targetId) return true;
        return isCircular(sourceConcept.parent_concept_id, targetId, visited);
      };
      
      if (isCircular(params.source, params.target)) {
        console.warn('Cannot create circular dependency');
        return;
      }
      
      // In mindmap, connecting means making source the parent of target
      console.log('🔗 Creating connection: parent =', params.source, 'child =', params.target);
      onConceptParentChange(params.target, params.source);
    }
  }, [onConceptParentChange, concepts]);

  if (concepts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg mb-2">No concepts to display</div>
          <div className="text-sm">Add concepts or adjust your filters to see the mindmap</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          console.log('🎯 ReactFlow onNodesChange called with:', changes);
          handleNodesChange(changes);
        }}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodeOrigin={nodeOrigin}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="bg-gradient-to-br from-background to-muted/20"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MindMapControls 
          onResetLayout={onResetLayout}
          isLoading={isLoading}
          nodes={nodes}
          saveMindmapPosition={saveMindmapPosition}
        />
        
        <Panel position="bottom-left">
          <div className="text-xs text-muted-foreground bg-background/80 p-2 rounded border max-w-md">
            <div>💡 <strong>Tip:</strong> Drag nodes to reposition • Drag from blue handles to connect • Click for details</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-green-500 rounded"></span>Approved
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded"></span>Suggested
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-500 rounded"></span>Rejected
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded"></span>Child Handle
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-primary rounded"></span>Parent Handle
              </div>
              {isLoading && <span className="text-blue-600">💾 Saving...</span>}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Controls component that uses useReactFlow inside ReactFlow context
const MindMapControls = ({ onResetLayout, isLoading, nodes, saveMindmapPosition }: {
  onResetLayout?: () => Promise<boolean>;
  isLoading: boolean;
  nodes: any[];
  saveMindmapPosition?: (conceptId: string, x: number, y: number) => Promise<boolean>;
}) => {
  const { fitView } = useReactFlow();

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.1, duration: 800 });
  }, [fitView]);

  const handleSaveLayout = useCallback(async () => {
    if (!saveMindmapPosition) return;
    
    console.log('🎯 Manual save - current nodes:', nodes);
    
    for (const node of nodes) {
      console.log('🎯 Saving node:', node.id, 'at position:', node.position);
      await saveMindmapPosition(node.id, node.position.x, node.position.y);
    }
  }, [nodes, saveMindmapPosition]);

  const handleResetLayout = useCallback(async () => {
    if (onResetLayout) {
      await onResetLayout();
      setTimeout(() => fitView({ padding: 0.1, duration: 800 }), 100);
    }
  }, [onResetLayout, fitView]);

  return (
    <Panel position="top-right" className="space-x-2">
      <Button
        onClick={handleFitView}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        title="Center and fit all nodes in view"
      >
        <ZoomIn className="h-4 w-4" />
        Fit View
      </Button>
      <Button
        onClick={handleSaveLayout}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={isLoading || !saveMindmapPosition}
        title="Save current node positions to database"
      >
        💾 Save Layout
      </Button>
      <Button
        onClick={handleResetLayout}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={isLoading}
        title="Reset all nodes to automatic layout positions"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Layout
      </Button>
    </Panel>
  );
};