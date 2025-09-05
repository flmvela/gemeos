import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DomainCard } from "./DomainCard";
import { DomainStats } from "@/types/dashboard";
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
  
  // Sample data for demonstration when no domains exist
  const sampleDomains: DomainStats[] = [
    {
      id: 'sample-1',
      name: 'IELTS',
      description: 'Prepares students for the International English Language Testing System, focusing on listening, reading, writing, and speaking skills.',
      status: 'active',
      concepts: 0,
      learningGoals: 0,
      exercises: 0,
      lastUpdated: '31.8.2025'
    },
    {
      id: 'sample-2',
      name: 'GMAT',
      description: 'Prepares students for the Graduate Management Admission Test, focusing on analytical, quantitative, verbal, and integrated reasoning skills.',
      status: 'active',
      concepts: 0,
      learningGoals: 0,
      exercises: 0,
      lastUpdated: '31.8.2025'
    },
    {
      id: 'sample-3',
      name: 'Jazz music',
      description: 'This domain focuses on mastering jazz, exploring its rich harmony, fluid rhythm, and improvisation techniques. It offers a comprehensive path to developing instrumental technique, ear training, and an understanding of the vast repertoire and styles of jazz',
      status: 'active',
      concepts: 62,
      learningGoals: 0,
      exercises: 0,
      lastUpdated: '31.8.2025'
    }
  ];

  // Use sample data if no domains provided
  const domainsToUse = domains.length === 0 ? sampleDomains : domains;

  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domainsToUse.filter((domain) => {
      const matchesSearch =
        domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        domain.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || domain.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    return filtered;
  }, [domainsToUse, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-text-muted h-4 w-4" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-surface-card border-dashboard-bg focus:border-dashboard-accent focus:ring-dashboard-accent/20 text-dashboard-primary placeholder:text-dashboard-text-muted"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-surface-card border-dashboard-bg text-dashboard-primary">
                <Filter className="h-4 w-4 mr-2 text-dashboard-secondary" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-surface-card border-dashboard-bg">
                <SelectItem value="all" className="text-dashboard-primary hover:bg-dashboard-bg/50">All Status</SelectItem>
                <SelectItem value="active" className="text-dashboard-primary hover:bg-dashboard-bg/50">Active</SelectItem>
                <SelectItem value="draft" className="text-dashboard-primary hover:bg-dashboard-bg/50">Draft</SelectItem>
                <SelectItem value="archived" className="text-dashboard-primary hover:bg-dashboard-bg/50">Archived</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>

        <Button 
          onClick={onCreateNew} 
          className="whitespace-nowrap bg-dashboard-primary hover:bg-dashboard-secondary text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Domain
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedDomains.map((domain) => (
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
          <div className="text-dashboard-text-muted text-sm">
            {searchQuery || statusFilter !== "all"
              ? "No domains match your search criteria."
              : "No domains found."}
          </div>
        </div>
      )}
    </div>
  );
}
