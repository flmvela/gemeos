/**
 * Tenant Filters Component
 * Provides filtering and sorting controls for the tenant grid
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';

interface TenantFiltersProps {
  searchValue: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' }
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'domain_count', label: 'Domain Count' },
  { value: 'teacher_count', label: 'Teachers' },
  { value: 'student_count', label: 'Students' },
  { value: 'last_activity', label: 'Last Activity' }
];

export const TenantFilters: React.FC<TenantFiltersProps> = ({
  searchValue,
  statusFilter,
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusFilterChange,
  onSortChange
}) => {
  const handleClearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('');
    onSortChange('name', 'asc');
  };

  const handleSortOrderToggle = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const hasActiveFilters = searchValue || statusFilter || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-4">
      {/* Main Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants by name, slug, or description..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => onSortChange(value, sortOrder)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSortOrderToggle}
            className="shrink-0"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchValue}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {statusFilter && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label}
              <button
                onClick={() => onStatusFilterChange('')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(sortBy !== 'name' || sortOrder !== 'asc') && (
            <Badge variant="secondary" className="gap-1">
              Sort: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label} ({sortOrder})
              <button
                onClick={() => onSortChange('name', 'asc')}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};