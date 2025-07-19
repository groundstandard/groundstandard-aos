import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal 
} from "lucide-react";

interface FilterState {
  search: string;
  roles: string[];
  statuses: string[];
  beltLevels: string[];
  hasPhone: boolean | null;
  hasEmergencyContact: boolean | null;
}

interface ContactTableFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'staff', label: 'Staff' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'member', label: 'Member' },
  { value: 'alumni', label: 'Alumni' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'suspended', label: 'Suspended' },
];

const BELT_OPTIONS = [
  { value: 'white', label: 'White Belt' },
  { value: 'yellow', label: 'Yellow Belt' },
  { value: 'orange', label: 'Orange Belt' },
  { value: 'green', label: 'Green Belt' },
  { value: 'blue', label: 'Blue Belt' },
  { value: 'brown', label: 'Brown Belt' },
  { value: 'black', label: 'Black Belt' },
];

export const ContactTableFilters = ({ 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: ContactTableFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roles: [],
    statuses: [],
    beltLevels: [],
    hasPhone: null,
    hasEmergencyContact: null,
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      search: '',
      roles: [],
      statuses: [],
      beltLevels: [],
      hasPhone: null,
      hasEmergencyContact: null,
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const toggleArrayFilter = (key: 'roles' | 'statuses' | 'beltLevels', value: string) => {
    const current = filters[key];
    const updated = current.includes(value) 
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.roles.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.beltLevels.length > 0) count++;
    if (filters.hasPhone !== null) count++;
    if (filters.hasEmergencyContact !== null) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      {/* Search and Summary */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filteredCount} of {totalCount} contacts
          </span>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-6 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Role Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={filters.roles.length > 0 ? "border-primary" : ""}
            >
              <Filter className="h-4 w-4 mr-1" />
              Role
              {filters.roles.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {filters.roles.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ROLE_OPTIONS.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.roles.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter('roles', option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={filters.statuses.length > 0 ? "border-primary" : ""}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Status
              {filters.statuses.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {filters.statuses.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.statuses.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter('statuses', option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Belt Level Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={filters.beltLevels.length > 0 ? "border-primary" : ""}
            >
              Belt Level
              {filters.beltLevels.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {filters.beltLevels.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Belt Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {BELT_OPTIONS.map(option => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.beltLevels.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter('beltLevels', option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Filters */}
        <Select 
          value={filters.hasPhone === null ? '' : filters.hasPhone.toString()}
          onValueChange={(value) => 
            updateFilters({ 
              hasPhone: value === '' ? null : value === 'true' 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Phone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">Has Phone</SelectItem>
            <SelectItem value="false">No Phone</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.hasEmergencyContact === null ? '' : filters.hasEmergencyContact.toString()}
          onValueChange={(value) => 
            updateFilters({ 
              hasEmergencyContact: value === '' ? null : value === 'true' 
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Emergency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="true">Has Emergency</SelectItem>
            <SelectItem value="false">No Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters({ search: '' })}
              />
            </Badge>
          )}
          
          {filters.roles.map(role => (
            <Badge key={role} variant="secondary" className="gap-1">
              Role: {ROLE_OPTIONS.find(r => r.value === role)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('roles', role)}
              />
            </Badge>
          ))}
          
          {filters.statuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find(s => s.value === status)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('statuses', status)}
              />
            </Badge>
          ))}
          
          {filters.beltLevels.map(belt => (
            <Badge key={belt} variant="secondary" className="gap-1">
              Belt: {BELT_OPTIONS.find(b => b.value === belt)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleArrayFilter('beltLevels', belt)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};