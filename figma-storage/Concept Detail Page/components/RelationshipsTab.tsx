import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, ArrowRight, ArrowLeft, Link, Trash2, Search } from "lucide-react";

interface Relationship {
  id: string;
  type: 'prerequisite' | 'builds_on' | 'related_to' | 'contains' | 'part_of';
  targetConcept: string;
  direction: 'outgoing' | 'incoming';
  description?: string;
}

const mockRelationships: Relationship[] = [
  {
    id: "1",
    type: "prerequisite",
    targetConcept: "Musical Intervals",
    direction: "outgoing",
    description: "Understanding intervals is essential before learning theory fundamentals"
  },
  {
    id: "2",
    type: "builds_on",
    targetConcept: "Chord Construction",
    direction: "incoming",
    description: "Chord construction builds upon music theory fundamentals"
  },
  {
    id: "3",
    type: "related_to",
    targetConcept: "Scale Modes",
    direction: "outgoing",
    description: "Scale modes are closely related to fundamental theory concepts"
  },
  {
    id: "4",
    type: "contains",
    targetConcept: "Circle of Fifths",
    direction: "outgoing",
    description: "The circle of fifths is a component of music theory fundamentals"
  },
  {
    id: "5",
    type: "part_of",
    targetConcept: "Music Education",
    direction: "outgoing",
    description: "Music theory fundamentals are part of broader music education"
  }
];

const relationshipTypes = [
  { value: 'prerequisite', label: 'Prerequisite', description: 'Must be learned before' },
  { value: 'builds_on', label: 'Builds On', description: 'Extends or builds upon' },
  { value: 'related_to', label: 'Related To', description: 'Generally related or connected' },
  { value: 'contains', label: 'Contains', description: 'Includes as a sub-concept' },
  { value: 'part_of', label: 'Part Of', description: 'Is a component of' },
];

interface RelationshipsTabProps {
  conceptId: string;
}

export function RelationshipsTab({ conceptId }: RelationshipsTabProps) {
  const [relationships, setRelationships] = useState(mockRelationships);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newRelationship, setNewRelationship] = useState({
    type: '',
    targetConcept: '',
    description: ''
  });

  const handleDeleteRelationship = (relationshipId: string) => {
    setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
  };

  const handleAddRelationship = () => {
    if (newRelationship.type && newRelationship.targetConcept) {
      const relationship: Relationship = {
        id: Date.now().toString(),
        type: newRelationship.type as Relationship['type'],
        targetConcept: newRelationship.targetConcept,
        direction: 'outgoing',
        description: newRelationship.description
      };
      setRelationships(prev => [...prev, relationship]);
      setNewRelationship({ type: '', targetConcept: '', description: '' });
      setIsAddDialogOpen(false);
    }
  };

  const getRelationshipIcon = (type: string, direction: string) => {
    switch (type) {
      case 'prerequisite':
        return direction === 'outgoing' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />;
      case 'builds_on':
        return direction === 'outgoing' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'prerequisite':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'builds_on':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'related_to':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'contains':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'part_of':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRelationshipLabel = (type: string, direction: string) => {
    const typeObj = relationshipTypes.find(t => t.value === type);
    if (!typeObj) return type;
    
    if (direction === 'incoming') {
      switch (type) {
        case 'prerequisite':
          return 'Is prerequisite for';
        case 'builds_on':
          return 'Is built upon by';
        case 'contains':
          return 'Is contained in';
        case 'part_of':
          return 'Contains';
        default:
          return typeObj.label;
      }
    }
    return typeObj.label;
  };

  const filteredRelationships = relationships.filter(rel =>
    rel.targetConcept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3>Relationships</h3>
          <p className="text-muted-foreground">
            Manage connections between this concept and others in the knowledge graph
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Relationship</DialogTitle>
              <DialogDescription>
                Create a new relationship between this concept and another concept in the knowledge graph.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="relationship-type">Relationship Type</Label>
                <Select value={newRelationship.type} onValueChange={(value) => 
                  setNewRelationship(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div>{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="target-concept">Target Concept</Label>
                <Input
                  id="target-concept"
                  value={newRelationship.targetConcept}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, targetConcept: e.target.value }))}
                  placeholder="Search or enter concept name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newRelationship.description}
                  onChange={(e) => setNewRelationship(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this relationship"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddRelationship}>Add Relationship</Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search relationships..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Relationships List */}
      <div className="space-y-3">
        {filteredRelationships.map((relationship) => (
          <Card key={relationship.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRelationshipIcon(relationship.type, relationship.direction)}
                    <Badge className={getRelationshipColor(relationship.type)}>
                      {getRelationshipLabel(relationship.type, relationship.direction)}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{relationship.targetConcept}</p>
                    {relationship.description && (
                      <p className="text-sm text-muted-foreground">
                        {relationship.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteRelationship(relationship.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRelationships.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent>
            <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No matching relationships' : 'No relationships yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'Connect this concept to others in your knowledge graph'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Relationship
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}