import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { 
  Search, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Filter,
  Plus,
  UserCheck,
  UserX,
  Award,
  Edit
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
  created_at: string;
  updated_at: string;
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  belt_level: string;
  emergency_contact: string;
  membership_status: string;
}

const Contacts = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "member",
    belt_level: "",
    emergency_contact: "",
    membership_status: "active"
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "member",
      belt_level: "",
      emergency_contact: "",
      membership_status: "active"
    });
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = `${contact.first_name} ${contact.last_name} ${contact.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || contact.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleColors = {
    visitor: "bg-gray-100 text-gray-800",
    member: "bg-green-100 text-green-800",
    alumni: "bg-purple-100 text-purple-800",
    staff: "bg-blue-100 text-blue-800",
    instructor: "bg-orange-100 text-orange-800",
    admin: "bg-red-100 text-red-800",
  };

  const handleAddContact = async () => {
    // Note: In a real app, contacts would be created through user registration
    // For demo purposes, we'll show a message
    toast({
      title: "Add Contact",
      description: "New contacts are typically added when users register for the academy through the authentication system.",
    });
    setShowAddDialog(false);
    resetForm();
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', selectedContact.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setContacts(contacts.map(c => c.id === selectedContact.id ? data : c));
      setShowEditDialog(false);
      setSelectedContact(null);
      resetForm();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setShowViewDialog(true);
  };

  const handleEditContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || "",
      role: contact.role,
      belt_level: contact.belt_level || "",
      emergency_contact: contact.emergency_contact || "",
      membership_status: contact.membership_status
    });
    setShowEditDialog(true);
  };

  const ContactForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            placeholder="Enter last name"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email address"
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="belt_level">Belt Level</Label>
          <Select value={formData.belt_level} onValueChange={(value) => setFormData({...formData, belt_level: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select belt level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="emergency_contact">Emergency Contact</Label>
        <Input
          id="emergency_contact"
          value={formData.emergency_contact}
          onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
          placeholder="Enter emergency contact"
        />
      </div>

      <div>
        <Label htmlFor="membership_status">Membership Status</Label>
        <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-8">Loading contacts...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Contact Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage academy members and their information
              </p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new member to your academy
                </DialogDescription>
              </DialogHeader>
              <ContactForm />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact}>
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterRole === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("all")}
                >
                  All ({contacts.length})
                </Button>
                <Button
                  variant={filterRole === "member" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("member")}
                >
                  Members ({contacts.filter(c => c.role === "member").length})
                </Button>
                <Button
                  variant={filterRole === "visitor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("visitor")}
                >
                  Visitors ({contacts.filter(c => c.role === "visitor").length})
                </Button>
                <Button
                  variant={filterRole === "alumni" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("alumni")}
                >
                  Alumni ({contacts.filter(c => c.role === "alumni").length})
                </Button>
                <Button
                  variant={filterRole === "staff" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("staff")}
                >
                  Staff ({contacts.filter(c => c.role === "staff").length})
                </Button>
                <Button
                  variant={filterRole === "instructor" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("instructor")}
                >
                  Instructors ({contacts.filter(c => c.role === "instructor").length})
                </Button>
                <Button
                  variant={filterRole === "admin" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRole("admin")}
                >
                  Admins ({contacts.filter(c => c.role === "admin").length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {contact.first_name} {contact.last_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </CardDescription>
                  </div>
                  <Badge className={roleColors[contact.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
                    {contact.role}
                  </Badge>
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
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewContact(contact)}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEditContactClick(contact)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterRole !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Start by adding your first contact"
                }
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* View Contact Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
              <DialogDescription>
                View detailed information for this contact
              </DialogDescription>
            </DialogHeader>
            {selectedContact && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="text-lg font-semibold">{selectedContact.first_name} {selectedContact.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge className={roleColors[selectedContact.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
                      {selectedContact.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedContact.email}
                    </p>
                  </div>
                  {selectedContact.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {selectedContact.phone}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedContact.belt_level && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Belt Level</Label>
                      <p className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        {selectedContact.belt_level} Belt
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Membership Status</Label>
                    <Badge variant={selectedContact.membership_status === 'active' ? 'default' : 'secondary'}>
                      {selectedContact.membership_status}
                    </Badge>
                  </div>
                </div>

                {selectedContact.emergency_contact && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Emergency Contact</Label>
                    <p>{selectedContact.emergency_contact}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Joined</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedContact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(selectedContact.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information
              </DialogDescription>
            </DialogHeader>
            <ContactForm />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditContact}>
                Update Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Contacts;