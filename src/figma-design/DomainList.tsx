import { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DomainCard } from "./DomainCard";
import { DomainStats } from "../types/dashboard";
import { Search, Plus, Filter } from "lucide-react";

interface DomainListProps {
  domains: DomainStats[];
  onCreateNew: () => void;
  onManageDomain: (domainId: string) => void;
  onViewAnalytics: (domainId: string) => void;
}

export function DomainList({ domains, onCreateNew, onManageDomain, onViewAnalytics }: DomainListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domains.filter(domain => {
      const matchesSearch = domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           domain.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || domain.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "concepts":
          return b.concepts - a.concepts;
        case "exercises":
          return b.exercises - a.exercises;
        case "updated":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [domains, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="concepts">Concepts</SelectItem>
                <SelectItem value="exercises">Exercises</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={onCreateNew} className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Create New Domain
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedDomains.map(domain => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onManage={onManageDomain}
            onViewAnalytics={onViewAnalytics}
          />
        ))}
      </div>
      
      {filteredAndSortedDomains.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "No domains match your search criteria."
              : "No domains found."}
          </div>
        </div>
      )}
    </div>
  );
}