import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  Users, 
  UserCheck, 
  Edit, 
  UserPlus,
  Eye,
  Baby
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

interface ContactCardProps {
  contact: Contact;
  children?: Contact[];
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onAddChild: (contact: Contact) => void;
  onViewFamily: (contact: Contact) => void;
}

export const ContactCard = ({ 
  contact, 
  children = [], 
  onView, 
  onEdit, 
  onAddChild, 
  onViewFamily 
}: ContactCardProps) => {
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
  };

  const isParent = children.length > 0;
  const isChild = !!contact.parent_id;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isChild ? 'ml-4 border-l-4 border-l-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {isParent && <Users className="h-4 w-4 text-primary" />}
              {isChild && <Baby className="h-4 w-4 text-muted-foreground" />}
              {contact.first_name} {contact.last_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Mail className="h-3 w-3" />
              {contact.email}
            </CardDescription>
            {isParent && (
              <CardDescription className="text-primary font-medium mt-1">
                Family Head • {children.length} {children.length === 1 ? 'child' : 'children'}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={roleColors[contact.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
              {contact.role}
            </Badge>
            <Badge 
              variant="outline" 
              className={statusColors[contact.membership_status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}
            >
              {contact.membership_status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </div>
          )}
          {contact.belt_level && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-3 w-3" />
              {contact.belt_level} Belt
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Joined {new Date(contact.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onView(contact)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onEdit(contact)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          {!isChild && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAddChild(contact)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Add Child
            </Button>
          )}
          {isParent && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onViewFamily(contact)}
            >
              <Users className="h-3 w-3 mr-1" />
              Family ({children.length})
            </Button>
          )}
        </div>

        {/* Show children preview if any */}
        {children.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Children:</p>
            <div className="flex flex-wrap gap-1">
              {children.slice(0, 3).map((child) => (
                <Badge key={child.id} variant="secondary" className="text-xs">
                  {child.first_name} {child.last_name}
                </Badge>
              ))}
              {children.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{children.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};