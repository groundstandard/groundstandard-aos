import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, Users, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContactFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterRole: string;
  onFilterRoleChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  showFamiliesOnly: boolean;
  onShowFamiliesOnlyChange: (value: boolean) => void;
  contacts: any[];
}

export const ContactFilters = ({
  searchTerm,
  onSearchChange,
  filterRole,
  onFilterRoleChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  showFamiliesOnly,
  onShowFamiliesOnlyChange,
  contacts
}: ContactFiltersProps) => {
  const isMobile = useIsMobile();
  
  const getRoleCount = (role: string) => {
    if (role === "all") return contacts.length;
    return contacts.filter(c => c.role === role).length;
  };

  const getFamilyCount = () => {
    return contacts.filter(c => c.parent_id || contacts.some(child => child.parent_id === c.id)).length;
  };

  return (
    <div className="space-y-4">
      {/* Mobile-Responsive Filter Interface */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          {/* Mobile: Stack elements vertically, Desktop: Side by side */}
          <div className={isMobile ? "space-y-3" : "flex items-center gap-3"}>
            {/* Search - Always takes full width on mobile */}
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Controls Row - Responsive */}
            <div className={isMobile ? "flex gap-2 overflow-x-auto pb-1" : "flex gap-2 items-center flex-shrink-0"}>
              {/* Sort Select - Responsive width */}
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className={isMobile ? "w-32 h-10 flex-shrink-0" : "w-32 h-10"}>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="created_at">Join Date</SelectItem>
                  <SelectItem value="belt_level">Belt Level</SelectItem>
                  <SelectItem value="membership_status">Status</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 h-10 flex-shrink-0"
                title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>

              {/* Family Toggle - Responsive */}
              <Button
                variant={showFamiliesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onShowFamiliesOnlyChange(!showFamiliesOnly)}
                className="flex items-center gap-1 px-3 whitespace-nowrap h-10 flex-shrink-0"
              >
                <Users className="h-3 w-3" />
                <span className="hidden sm:inline">Families Only</span>
                <span className="sm:hidden">Families</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{contacts.length} contact{contacts.length !== 1 ? 's' : ''} found</span>
        {getFamilyCount() > 0 && (
          <span>{getFamilyCount()} Family Member{getFamilyCount() !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
};