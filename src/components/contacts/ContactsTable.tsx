import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  UserPlus, 
  Users 
} from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  belt_level?: string;
  emergency_contact?: string;
  membership_status: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface Column {
  id: keyof Contact | 'full_name' | 'actions';
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onAddChild: (contact: Contact) => void;
  onViewFamily: (contact: Contact) => void;
  onContactClick?: (contact: Contact) => void;
  selectedContactIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  filterRole?: string;
  onFilterRoleChange?: (value: string) => void;
  allContacts?: Contact[];
  searchTerm?: string;
  showFamiliesOnly?: boolean;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'full_name', label: 'Name', visible: true, sortable: true, width: 'w-48' },
  { id: 'email', label: 'Email', visible: true, sortable: true, width: 'w-56' },
  { id: 'phone', label: 'Phone', visible: true, sortable: false, width: 'w-36' },
  { id: 'role', label: 'Role', visible: true, sortable: true, width: 'w-24' },
  { id: 'belt_level', label: 'Belt', visible: true, sortable: true, width: 'w-24' },
  { id: 'membership_status', label: 'Status', visible: true, sortable: true, width: 'w-24' },
  { id: 'emergency_contact', label: 'Emergency', visible: false, sortable: false, width: 'w-48' },
  { id: 'created_at', label: 'Joined', visible: false, sortable: true, width: 'w-32' },
  { id: 'actions', label: 'Actions', visible: true, sortable: false, width: 'w-24' },
];

export const ContactsTable = ({ 
  contacts, 
  onView, 
  onEdit, 
  onAddChild, 
  onViewFamily,
  onContactClick,
  selectedContactIds = [],
  onSelectionChange,
  filterRole = "all",
  onFilterRoleChange,
  allContacts = [],
  searchTerm = "",
  showFamiliesOnly = false
}: ContactsTableProps) => {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [sortBy, setSortBy] = useState<string>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const roleColors = {
    visitor: "bg-gray-100 text-gray-800",
    member: "bg-green-100 text-green-800", 
    alumni: "bg-purple-100 text-purple-800",
    staff: "bg-blue-100 text-blue-800",
    instructor: "bg-orange-100 text-orange-800",
    admin: "bg-red-100 text-red-800",
    student: "bg-green-100 text-green-800",
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800", 
    alumni: "bg-purple-100 text-purple-800",
    suspended: "bg-yellow-100 text-yellow-800",
  };

  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible), 
    [columns]
  );

  const sortedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'full_name':
          aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
          bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'belt_level':
          const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
          aValue = beltOrder.indexOf((a.belt_level || 'white').toLowerCase());
          bValue = beltOrder.indexOf((b.belt_level || 'white').toLowerCase());
          break;
        case 'membership_status':
          aValue = a.membership_status;
          bValue = b.membership_status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortBy as keyof Contact] || '';
          bValue = b[sortBy as keyof Contact] || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [contacts, sortBy, sortOrder]);

  const handleSort = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const toggleSelectAll = () => {
    const newSelection = selectedContactIds.length === contacts.length ? [] : contacts.map(c => c.id);
    onSelectionChange?.(newSelection);
  };

  const toggleSelectContact = (contactId: string) => {
    const newSelection = selectedContactIds.includes(contactId)
      ? selectedContactIds.filter(id => id !== contactId)
      : [...selectedContactIds, contactId];
    onSelectionChange?.(newSelection);
  };

  const formatCellValue = (contact: Contact, columnId: string) => {
    switch (columnId) {
      case 'full_name':
        return `${contact.first_name} ${contact.last_name}`;
      case 'phone':
        return contact.phone || '-';
      case 'belt_level':
        return contact.belt_level || '-';
      case 'emergency_contact':
        return contact.emergency_contact || '-';
      case 'created_at':
        return new Date(contact.created_at).toLocaleDateString();
      default:
        return contact[columnId as keyof Contact] || '-';
    }
  };

  const hasChildren = (contact: Contact) => {
    return contacts.some(c => c.parent_id === contact.id);
  };

  // Helper functions for role filtering
  const getRoleCount = (role: string) => {
    if (role === "all") return allContacts.length;
    return allContacts.filter(c => c.role === role).length;
  };

  const getFamilyCount = () => {
    return allContacts.filter(c => c.parent_id || allContacts.some(child => child.parent_id === c.id)).length;
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Table Header with Role Filters and Column Management */}
      <div className="space-y-3 p-4 border-b">
        {/* Top Row: Role Filter Buttons */}
        {onFilterRoleChange && allContacts.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
            </div>
            
            {/* Family Contacts Badge */}
            <Badge variant="secondary" className="flex items-center gap-1 ml-auto">
              <Users className="h-3 w-3" />
              {getFamilyCount()} Family Members
            </Badge>
          </div>
        )}

        {/* Bottom Row: Contact Count and Columns Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedContactIds.length === contacts.length && contacts.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedContactIds.length > 0 ? `${selectedContactIds.length} selected` : `${contacts.length} contacts`}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(column.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Checkbox checked={column.visible} />
                  {column.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left w-12">
                <Checkbox
                  checked={selectedContactIds.length === contacts.length && contacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              {visibleColumns.map(column => (
                <th 
                  key={column.id} 
                  className={`p-3 text-left text-sm font-medium ${column.width || ''}`}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      {column.label}
                      {sortBy === column.id && (
                        sortOrder === 'asc' ? 
                          <ChevronUp className="ml-1 h-3 w-3" /> : 
                          <ChevronDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedContacts.map(contact => (
              <tr 
                key={contact.id} 
                className="border-b hover:bg-muted/30 transition-colors"
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedContactIds.includes(contact.id)}
                    onCheckedChange={() => toggleSelectContact(contact.id)}
                  />
                </td>
                {visibleColumns.map(column => (
                  <td key={column.id} className="p-3 text-sm">
                    {column.id === 'role' ? (
                      <Badge 
                        variant="secondary" 
                        className={roleColors[contact.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}
                      >
                        {contact.role}
                      </Badge>
                    ) : column.id === 'membership_status' ? (
                      <Badge 
                        variant="secondary"
                        className={statusColors[contact.membership_status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
                      >
                        {contact.membership_status}
                      </Badge>
                    ) : column.id === 'actions' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(contact)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(contact)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAddChild(contact)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Child
                          </DropdownMenuItem>
                          {hasChildren(contact) && (
                            <DropdownMenuItem onClick={() => onViewFamily(contact)}>
                              <Users className="mr-2 h-4 w-4" />
                              View Family
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : column.id === 'full_name' && onContactClick ? (
                      <button 
                        onClick={() => onContactClick(contact)}
                        className="text-left hover:text-primary hover:underline font-medium transition-colors"
                        title={formatCellValue(contact, column.id)}
                      >
                        {formatCellValue(contact, column.id)}
                      </button>
                    ) : (
                      <span className="truncate block max-w-full" title={formatCellValue(contact, column.id)}>
                        {formatCellValue(contact, column.id)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedContacts.length === 0 && (
        <div className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterRole !== "all" || showFamiliesOnly
              ? "Try adjusting your search or filter criteria"
              : "Start by adding your first contact"
            }
          </p>
        </div>
      )}
    </div>
  );
};