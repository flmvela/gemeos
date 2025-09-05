import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Concept } from '@/hooks/useConcepts';
import { CheckCircle, XCircle, BookOpen, Zap } from 'lucide-react';

interface ConceptNodeData {
  concept: Concept;
  level: number;
  onConceptClick?: (concept: Concept) => void;
  onConceptApprove?: (conceptId: string) => void;
  onConceptReject?: (conceptId: string) => void;
}

export const ConceptFlowNode: React.FC<NodeProps> = ({
  data,
  selected,
}) => {
  const { concept, level, onConceptClick, onConceptApprove, onConceptReject } = data as unknown as ConceptNodeData;
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'suggested':
        return {
          color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
          icon: <Zap className="h-3 w-3" />,
          variant: 'secondary' as const,
        };
      case 'approved':
        return {
          color: 'bg-green-100 border-green-300 text-green-800',
          icon: <CheckCircle className="h-3 w-3" />,
          variant: 'default' as const,
        };
      case 'rejected':
        return {
          color: 'bg-red-100 border-red-300 text-red-800',
          icon: <XCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
        };
      default:
        return {
          color: 'bg-gray-100 border-gray-300 text-gray-800',
          icon: <BookOpen className="h-3 w-3" />,
          variant: 'outline' as const,
        };
    }
  };
  
  const getLevelConfig = (level: number) => {
    const colors = [
      'border-l-blue-500',    // Level 0 - Blue
      'border-l-purple-500',  // Level 1 - Purple
      'border-l-green-500',   // Level 2 - Green
      'border-l-orange-500',  // Level 3 - Orange
    ];
    return colors[level % colors.length] || 'border-l-gray-500';
  };
  
  // Level badge styles for L0-L3
  const getLevelBadgeStyles = (level: number) => {
    const classes = [
      'bg-green-100 border-green-300 text-green-800',  // L0 - Green
      'bg-yellow-100 border-yellow-300 text-yellow-800', // L1 - Yellow
      'bg-orange-100 border-orange-300 text-orange-800', // L2 - Orange
      'bg-red-100 border-red-300 text-red-800', // L3 - Red
    ];
    return classes[level % classes.length] || 'bg-gray-100 border-gray-300 text-gray-800';
  };
  
  const statusConfig = getStatusConfig(concept.status);
  const levelConfig = getLevelConfig(level);
  const levelBadgeClasses = getLevelBadgeStyles(level);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptClick?.(concept);
  };
  
  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptApprove?.(concept.id);
  };
  
  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConceptReject?.(concept.id);
  };
  
  return (
    <div className="relative">
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 border-2 border-primary"
      />
      
      <Card 
        className={`
          w-80 cursor-pointer transition-all duration-200 border-l-4
          ${levelConfig}
          ${statusConfig.color}
          ${selected ? 'ring-2 ring-primary shadow-lg scale-105' : 'hover:shadow-md hover:scale-102'}
        `}
        onClick={handleClick}
      >
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header with title and level */}
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-base line-clamp-2 flex-1 leading-tight">
                {concept.name}
              </h3>
              <Badge variant="outline" className={`text-xs ml-2 flex-shrink-0 ${levelBadgeClasses}`}>
                L{level}
              </Badge>
            </div>
            
            {/* Description */}
            {concept.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {concept.description}
              </p>
            )}
            
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              {concept.status !== 'approved' && (
                <Badge variant={statusConfig.variant} className="text-xs">
                  <span className="flex items-center gap-1">
                    {statusConfig.icon}
                    {concept.status}
                  </span>
                </Badge>
              )}
              
              {/* Action buttons for suggested concepts */}
              {concept.status === 'suggested' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={handleApprove}
                    title="Approve concept"
                  >
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={handleReject}
                    title="Reject concept"
                  >
                    <XCircle className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-primary"
      />
    </div>
  );
};