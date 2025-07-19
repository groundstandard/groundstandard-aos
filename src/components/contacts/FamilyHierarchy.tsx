import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, UserPlus, Edit, Eye, Baby, Phone, Mail, Award } from "lucide-react";

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

interface FamilyHierarchyProps {
  open: boolean;
  onClose: () => void;
  primaryContact: Contact | null;
  familyMembers: Contact[];
  onEdit: (contact: Contact) => void;
  onView: (contact: Contact) => void;
  onAddChild: (contact: Contact) => void;
}

export const FamilyHierarchy = ({ 
  open, 
  onClose, 
  primaryContact, 
  familyMembers, 
  onEdit, 
  onView, 
  onAddChild 
}: FamilyHierarchyProps) => {
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

  const toggleExpanded = (contactId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedFamilies(newExpanded);
  };

  const roleColors = {
    visitor: "bg-gray-100 text-gray-800",
    member: "bg-green-100 text-green-800",
    alumni: "bg-purple-100 text-purple-800",
    staff: "bg-blue-100 text-blue-800",
    instructor: "bg-orange-100 text-orange-800",
    admin: "bg-red-100 text-red-800",
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
    trial: "bg-yellow-100 text-yellow-800",
  };

  if (!primaryContact) return null;

  const children = familyMembers.filter(member => member.parent_id === primaryContact.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Hierarchy - {primaryContact.first_name} {primaryContact.last_name}
          </DialogTitle>
          <DialogDescription>
            View and manage family members and their relationships
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Primary Contact */}
          <Card className="border-2 border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {primaryContact.first_name} {primaryContact.last_name}
                  </CardTitle>
                  <Badge variant="outline" className="text-primary border-primary">
                    Family Head
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(primaryContact)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEdit(primaryContact)}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAddChild(primaryContact)}>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Add Child
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>{primaryContact.email}</span>
                </div>
                {primaryContact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{primaryContact.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge className={roleColors[primaryContact.role as keyof typeof roleColors]}>
                    {primaryContact.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[primaryContact.membership_status as keyof typeof statusColors]}>
                    {primaryContact.membership_status}
                  </Badge>
                </div>
                {primaryContact.belt_level && (
                  <div className="flex items-center gap-2">
                    <Award className="h-3 w-3 text-muted-foreground" />
                    <span>{primaryContact.belt_level} Belt</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children */}
          {children.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Children ({children.length})
              </h3>
              
              <div className="grid gap-3">
                {children.map((child) => (
                  <Card key={child.id} className="ml-4 border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {child.first_name} {child.last_name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            Child
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onView(child)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onEdit(child)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{child.email}</span>
                        </div>
                        {child.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{child.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className={roleColors[child.role as keyof typeof roleColors]}>
                            {child.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[child.membership_status as keyof typeof statusColors]}>
                            {child.membership_status}
                          </Badge>
                        </div>
                        {child.belt_level && (
                          <div className="flex items-center gap-2">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span>{child.belt_level} Belt</span>
                          </div>
                        )}
                        {child.emergency_contact && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            Emergency: {child.emergency_contact}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Children Added</h3>
                <p className="text-muted-foreground mb-4">
                  This contact doesn't have any children registered yet.
                </p>
                <Button onClick={() => onAddChild(primaryContact)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Child
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};