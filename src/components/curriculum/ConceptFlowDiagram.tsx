import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  Position,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Concept } from '@/hooks/useConcepts';
import { ConceptFlowNode } from './ConceptFlowNode';

interface ConceptFlowDiagramProps {
  concepts: Concept[];
  onConceptClick?: (concept: Concept) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptReject?: (conceptId: string) => void;
  onConceptParentChange?: (conceptId: string, parentId: string) => void;
}

const nodeTypes = {
  conceptNode: ConceptFlowNode,
} as const;

export const ConceptFlowDiagram: React.FC<ConceptFlowDiagramProps> = ({
  concepts,
  onConceptClick,
  onConceptApprove,
  onConceptReject,
  onConceptParentChange,
}) => {
  // Transform concepts into React Flow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    // Group concepts by hierarchy level
    const conceptLevels = new Map<string, number>();
    const rootConcepts = concepts.filter(c => !c.parent_concept_id);
    
    // Calculate levels for each concept
    const calculateLevel = (concept: Concept, level = 0): void => {
      conceptLevels.set(concept.id, level);
      const children = concepts.filter(c => c.parent_concept_id === concept.id);
      children.forEach(child => calculateLevel(child, level + 1));
    };
    
    rootConcepts.forEach(concept => calculateLevel(concept));
    
    // Group concepts by level for positioning
    const levelGroups = new Map<number, Concept[]>();
    concepts.forEach(concept => {
      const level = conceptLevels.get(concept.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(concept);
    });
    
    // Create nodes with hierarchical positioning
    const nodes: Node[] = [];
    const horizontalSpacing = 300;
    const verticalSpacing = 150;
    
    Array.from(levelGroups.entries()).forEach(([level, levelConcepts]) => {
      levelConcepts.forEach((concept, index) => {
        const totalWidth = (levelConcepts.length - 1) * horizontalSpacing;
        const startX = -totalWidth / 2;
        
        nodes.push({
          id: concept.id,
          type: 'conceptNode',
          position: {
            x: startX + index * horizontalSpacing,
            y: level * verticalSpacing,
          },
          data: {
            concept,
            level,
            onConceptClick,
            onConceptApprove,
            onConceptReject,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });
    
    // Create edges for parent-child relationships
    const edges: Edge[] = concepts
      .filter(concept => concept.parent_concept_id)
      .map(concept => ({
        id: `${concept.parent_concept_id}-${concept.id}`,
        source: concept.parent_concept_id!,
        target: concept.id,
        type: 'smoothstep',
        animated: concept.status === 'suggested',
        style: {
          stroke: concept.status === 'suggested' ? '#f59e0b' : 
                  concept.status === 'approved' ? '#10b981' : 
                  concept.status === 'rejected' ? '#ef4444' : '#6b7280',
          strokeWidth: 2,
        },
      }));
    
    return { nodes, edges };
  }, [concepts, onConceptClick, onConceptApprove, onConceptReject]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const manuallyPositionedNodes = React.useRef(new Set<string>());
  
  // Track when nodes are manually moved
  const handleNodesChange = React.useCallback((changes: any[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.dragging === false) {
        // Node was manually positioned
        manuallyPositionedNodes.current.add(change.id);
      }
    });
    onNodesChange(changes);
  }, [onNodesChange]);
  
  // Update nodes and edges when concepts change, preserving manual positions
  React.useEffect(() => {
    setNodes((currentNodes) => {
      const existingNodePositions = new Map(
        currentNodes.map(node => [node.id, { position: node.position, measured: node.measured }])
      );
      
      return initialNodes.map(newNode => {
        const existing = existingNodePositions.get(newNode.id);
        // Only preserve position if it was manually set AND the node still exists
        if (existing && manuallyPositionedNodes.current.has(newNode.id)) {
          return {
            ...newNode,
            position: existing.position,
            measured: existing.measured
          };
        }
        return newNode;
      });
    });
    
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  const nodeClassName = useCallback((node: Node) => {
    const concept = node.data.concept as Concept;
    return `concept-node-${concept.status}`;
  }, []);

  // Handle connection creation when dragging from one node to another
  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && onConceptParentChange) {
      // Prevent self-connections
      if (params.source === params.target) {
        return;
      }
      
      // Check for circular dependencies
      const wouldCreateCircularDependency = (childId: string, potentialParentId: string): boolean => {
        const findParentIds = (conceptId: string): string[] => {
          const concept = concepts.find(c => c.id === conceptId);
          if (!concept || !concept.parent_concept_id) return [];
          return [concept.parent_concept_id, ...findParentIds(concept.parent_concept_id)];
        };
        
        const ancestorIds = findParentIds(potentialParentId);
        return ancestorIds.includes(childId);
      };
      
      if (!wouldCreateCircularDependency(params.target, params.source)) {
        // Update the parent-child relationship
        onConceptParentChange(params.target, params.source);
        
        // Add the edge to local state
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#10b981',
            strokeWidth: 2,
          },
        }, eds));
      }
    }
  }, [concepts, onConceptParentChange, setEdges]);
  
  if (concepts.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No concepts to display</p>
          <p className="text-sm">Add some concepts to see the visualization</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.4,
          maxZoom: 2.0,
        }}
        className="bg-background"
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeClassName={nodeClassName}
          pannable
          zoomable
          className="bg-background"
        />
      </ReactFlow>
    </div>
  );
};