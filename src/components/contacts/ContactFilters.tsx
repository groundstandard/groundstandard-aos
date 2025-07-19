import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ArrowUpDown, Users, UserCheck } from "lucide-react";

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
  const getRoleCount = (role: string) => {
    if (role === "all") return contacts.length;
    return contacts.filter(c => c.role === role).length;
  };

  const getFamilyCount = () => {
    return contacts.filter(c => c.parent_id || contacts.some(child => child.parent_id === c.id)).length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, email, phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Options */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-40">
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

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Family Toggle */}
            <Button
              variant={showFamiliesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => onShowFamiliesOnlyChange(!showFamiliesOnly)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Families Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterRole === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("all")}
            >
              All ({getRoleCount("all")})
            </Button>
            <Button
              variant={filterRole === "member" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("member")}
            >
              Members ({getRoleCount("member")})
            </Button>
            <Button
              variant={filterRole === "visitor" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("visitor")}
            >
              Visitors ({getRoleCount("visitor")})
            </Button>
            <Button
              variant={filterRole === "alumni" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("alumni")}
            >
              Alumni ({getRoleCount("alumni")})
            </Button>
            <Button
              variant={filterRole === "staff" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("staff")}
            >
              Staff ({getRoleCount("staff")})
            </Button>
            <Button
              variant={filterRole === "instructor" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("instructor")}
            >
              Instructors ({getRoleCount("instructor")})
            </Button>
            <Button
              variant={filterRole === "admin" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterRoleChange("admin")}
            >
              Admins ({getRoleCount("admin")})
            </Button>
            
            {/* Family Contacts Badge */}
            <div className="ml-auto">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {getFamilyCount()} Family Members
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};