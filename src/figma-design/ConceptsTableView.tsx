import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Edit, Trash2, Check, X, Target } from 'lucide-react';
import { Concept } from '../types/concepts';
import { getStatusBadgeClass, getStatusDisplayText, getLevelBadgeProps, getParentName } from '../utils/conceptsUtils';

interface ConceptsTableViewProps {
  concepts: Concept[];
  allConcepts: Concept[];
  onViewDetails: (conceptId: string, tab?: string) => void;
  onDeleteConcept: (conceptId: string) => void;
  onApproveConcept: (conceptId: string) => void;
  onRejectConcept: (conceptId: string) => void;
}

export function ConceptsTableView({
  concepts,
  allConcepts,
  onViewDetails,
  onDeleteConcept,
  onApproveConcept,
  onRejectConcept
}: ConceptsTableViewProps) {
  
  const getActionsForStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return ['approve', 'reject', 'edit', 'delete'];
      case 'approved':
        return ['reject', 'edit', 'learning-goals', 'delete'];
      case 'rejected':
        return ['approve', 'edit', 'delete'];
      case 'ai-suggested':
        return ['approve', 'reject', 'edit', 'delete'];
      default:
        return ['edit', 'delete'];
    }
  };

  const renderActionButton = (action: string, concept: Concept) => {
    const baseClasses = "h-8 w-8 p-0";
    
    switch (action) {
      case 'approve':
        return (
          <Button
            key="approve"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onApproveConcept(concept.id);
            }}
            className={`${baseClasses} text-green-600 hover:text-green-700 hover:bg-green-50`}
            title="Approve concept"
          >
            <Check className="h-4 w-4" />
          </Button>
        );
      
      case 'reject':
        return (
          <Button
            key="reject"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRejectConcept(concept.id);
            }}
            className={`${baseClasses} text-red-600 hover:text-red-700 hover:bg-red-50`}
            title="Reject concept"
          >
            <X className="h-4 w-4" />
          </Button>
        );
      
      case 'edit':
        return (
          <Button
            key="edit"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(concept.id, 'overview');
            }}
            className={`${baseClasses} text-gray-600 hover:text-gray-700 hover:bg-gray-50`}
            title="Edit concept"
          >
            <Edit className="h-4 w-4" />
          </Button>
        );
      
      case 'learning-goals':
        return (
          <Button
            key="learning-goals"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Learning goals for:', concept.id);
            }}
            className={`${baseClasses} text-blue-600 hover:text-blue-700 hover:bg-blue-50`}
            title="Learning goals"
          >
            <Target className="h-4 w-4" />
          </Button>
        );
      
      case 'delete':
        return (
          <Button
            key="delete"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConcept(concept.id);
            }}
            className={`${baseClasses} text-red-600 hover:text-red-700 hover:bg-red-50`}
            title="Delete concept"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      
      default:
        return null;
    }
  };
  return (
    <div className="px-6 py-6">
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-gray-50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="text-gray-600">Concept Name</TableHead>
              <TableHead className="text-gray-600">Status</TableHead>
              <TableHead className="text-gray-600">Level</TableHead>
              <TableHead className="text-gray-600">Parent</TableHead>
              <TableHead className="text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concepts.map((concept) => (
              <TableRow 
                key={concept.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onViewDetails(concept.id, 'overview')}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground text-base">{concept.name}</div>
                    {concept.description && (
                      <div className="text-muted-foreground mt-1">
                        {concept.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={concept.status === 'approved' ? 'default' : 'secondary'}
                    className={getStatusBadgeClass(concept.status)}
                  >
                    {getStatusDisplayText(concept.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getLevelBadgeProps(concept.level)} border-0`}
                  >
                    L{concept.level}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getParentName(concept.parentId, allConcepts)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {getActionsForStatus(concept.status).map(action => 
                      renderActionButton(action, concept)
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}