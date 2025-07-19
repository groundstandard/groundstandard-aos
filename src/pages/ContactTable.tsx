import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactTableFilters } from "@/components/contacts/ContactTableFilters";
import { AddChildDialog } from "@/components/contacts/AddChildDialog";
import { FamilyHierarchy } from "@/components/contacts/FamilyHierarchy";
import { 
  Users, 
  Plus, 
  Download,
  Upload,
  MoreHorizontal
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

interface FilterState {
  search: string;
  roles: string[];
  statuses: string[];
  beltLevels: string[];
  hasPhone: boolean | null;
  hasEmergencyContact: boolean | null;
}

const ContactTable = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    roles: [],
    statuses: [],
    beltLevels: [],
    hasPhone: null,
    hasEmergencyContact: null,
  });
  
  // Dialog states
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "student",
    belt_level: "",
    emergency_contact: "",
    membership_status: "active"
  });

  useEffect(() => {
    fetchContacts();
  }, []);

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

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchText = `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.phone || ''}`.toLowerCase();
        if (!searchText.includes(searchTerm)) return false;
      }

      // Role filter
      if (filters.roles.length > 0 && !filters.roles.includes(contact.role)) {
        return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(contact.membership_status)) {
        return false;
      }

      // Belt level filter
      if (filters.beltLevels.length > 0) {
        if (!contact.belt_level || !filters.beltLevels.includes(contact.belt_level.toLowerCase())) {
          return false;
        }
      }

      // Phone filter
      if (filters.hasPhone !== null) {
        const hasPhone = !!(contact.phone && contact.phone.trim());
        if (hasPhone !== filters.hasPhone) return false;
      }

      // Emergency contact filter
      if (filters.hasEmergencyContact !== null) {
        const hasEmergency = !!(contact.emergency_contact && contact.emergency_contact.trim());
        if (hasEmergency !== filters.hasEmergencyContact) return false;
      }

      return true;
    });
  }, [contacts, filters]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "student",
      belt_level: "",
      emergency_contact: "",
      membership_status: "active"
    });
  };

  const handleAddContact = async () => {
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

  const handleAddChild = (parent: Contact) => {
    setSelectedContact(parent);
    setShowAddChildDialog(true);
  };

  const handleChildAdded = (newChild: Contact) => {
    setContacts([...contacts, newChild]);
    toast({
      title: "Child Added",
      description: `${newChild.first_name} has been added to the family`,
    });
  };

  const handleViewFamily = (contact: Contact) => {
    setSelectedContact(contact);
    setShowFamilyDialog(true);
  };

  const exportContacts = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Role', 'Belt Level', 'Status', 'Emergency Contact', 'Joined'].join(','),
      ...filteredContacts.map(contact => [
        `"${contact.first_name} ${contact.last_name}"`,
        contact.email,
        contact.phone || '',
        contact.role,
        contact.belt_level || '',
        contact.membership_status,
        contact.emergency_contact || '',
        new Date(contact.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
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
              <SelectItem value="white">White Belt</SelectItem>
              <SelectItem value="yellow">Yellow Belt</SelectItem>
              <SelectItem value="orange">Orange Belt</SelectItem>
              <SelectItem value="green">Green Belt</SelectItem>
              <SelectItem value="blue">Blue Belt</SelectItem>
              <SelectItem value="brown">Brown Belt</SelectItem>
              <SelectItem value="black">Black Belt</SelectItem>
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
            <SelectItem value="alumni">Alumni</SelectItem>
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
                Manage academy members in a table format with advanced filtering
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportContacts}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
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
        </div>

        {/* Filters */}
        <ContactTableFilters
          onFiltersChange={setFilters}
          totalCount={contacts.length}
          filteredCount={filteredContacts.length}
        />

        {/* Table */}
        <div className="mt-6">
          <ContactsTable
            contacts={filteredContacts}
            onView={handleViewContact}
            onEdit={handleEditContactClick}
            onAddChild={handleAddChild}
            onViewFamily={handleViewFamily}
          />
        </div>

        {/* Dialogs */}
        
        {/* View Contact Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
            </DialogHeader>
            {selectedContact && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm">{selectedContact.first_name} {selectedContact.last_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedContact.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedContact.phone || '-'}</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <p className="text-sm capitalize">{selectedContact.role}</p>
                  </div>
                  <div>
                    <Label>Belt Level</Label>
                    <p className="text-sm">{selectedContact.belt_level || '-'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="text-sm capitalize">{selectedContact.membership_status}</p>
                  </div>
                  <div className="col-span-2">
                    <Label>Emergency Contact</Label>
                    <p className="text-sm">{selectedContact.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <Label>Joined</Label>
                    <p className="text-sm">{new Date(selectedContact.created_at).toLocaleDateString()}</p>
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
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Child Dialog */}
        {selectedContact && (
          <AddChildDialog
            open={showAddChildDialog}
            onClose={() => setShowAddChildDialog(false)}
            parentContact={selectedContact}
            onChildAdded={handleChildAdded}
          />
        )}

        {/* Family Hierarchy Dialog */}
        {selectedContact && (
          <FamilyHierarchy
            open={showFamilyDialog}
            onClose={() => setShowFamilyDialog(false)}
            primaryContact={selectedContact}
            familyMembers={contacts}
            onEdit={handleEditContactClick}
            onView={handleViewContact}
            onAddChild={handleAddChild}
          />
        )}
      </div>
    </div>
  );
};

export default ContactTable;