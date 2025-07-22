import { useState, useEffect, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { ContactCard } from "@/components/contacts/ContactCard";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { BulkActionsToolbar } from "@/components/contacts/BulkActionsToolbar";
import { AddChildDialog } from "@/components/contacts/AddChildDialog";
import { FamilyHierarchy } from "@/components/contacts/FamilyHierarchy";
import { EnhancedContactForm } from "@/components/contacts/EnhancedContactForm";
// import { AssignMembershipDialog } from "@/components/contacts/AssignMembershipDialog";
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
  Edit,
  Eye,
  LayoutGrid,
  List,
  Columns,
  Table,
  ExternalLink,
  CreditCard
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
  relationship_type: string;
  linked_contact_id?: string;
}

const Contacts = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFamiliesOnly, setShowFamiliesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'family'>('list');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "member",
    belt_level: "",
    emergency_contact: "",
    membership_status: "active",
    relationship_type: "none",
    linked_contact_id: undefined
  });

  // Authentication guard
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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
      membership_status: "active",
      relationship_type: "none",
      linked_contact_id: undefined
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
      setContactsLoading(false);
    }
  };

  const organizeContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = `${contact.first_name} ${contact.last_name} ${contact.email} ${contact.phone || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || 
        (filterRole === "alumni" ? contact.membership_status === "alumni" : contact.role === filterRole);
      return matchesSearch && matchesRole;
    });

    // Filter for families only if requested
    if (showFamiliesOnly) {
      filtered = filtered.filter(contact => 
        contact.parent_id || contacts.some(child => child.parent_id === contact.id)
      );
    }

    // Sort contacts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
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
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'belt_level':
          const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black'];
          aValue = beltOrder.indexOf(a.belt_level || 'white');
          bValue = beltOrder.indexOf(b.belt_level || 'white');
          break;
        case 'membership_status':
          aValue = a.membership_status;
          bValue = b.membership_status;
          break;
        default:
          aValue = a.first_name;
          bValue = b.first_name;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Organize by families
    const families: { parent: Contact; children: Contact[] }[] = [];
    const individualContacts: Contact[] = [];

    filtered.forEach(contact => {
      if (!contact.parent_id) {
        const children = filtered.filter(child => child.parent_id === contact.id);
        if (children.length > 0) {
          families.push({ parent: contact, children });
        } else {
          individualContacts.push(contact);
        }
      }
    });

    return { families, individualContacts, allFiltered: filtered };
  }, [contacts, searchTerm, filterRole, sortBy, sortOrder, showFamiliesOnly]);

  const roleColors = {
    visitor: "bg-gray-100 text-gray-800",
    member: "bg-green-100 text-green-800",
    alumni: "bg-purple-100 text-purple-800",
    staff: "bg-blue-100 text-blue-800",
    instructor: "bg-orange-100 text-orange-800",
    admin: "bg-red-100 text-red-800",
  };

  const handleAddContact = async () => {
    try {
      // Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication required');
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add contacts",
          variant: "destructive",
        });
        return;
      }

      // Generate a unique check-in PIN
      const generatePin = () => {
        return Math.floor(1000 + Math.random() * 9000).toString();
      };

      // Prepare contact data for insertion
      const contactData = {
        id: crypto.randomUUID(),
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone: formData.phone || null,
        belt_level: formData.belt_level || null,
        emergency_contact_name: formData.emergency_contact || null,
        membership_status: formData.membership_status,
        check_in_pin: generatePin()
      };

      console.log('Adding contact with data:', contactData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(contactData as any)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Failed to create contact - no data returned');
      }

      const newContact = data[0];

      // Handle family relationship if a parent contact was selected
      if (formData.linked_contact_id && formData.relationship_type !== 'none') {
        const relationshipData = {
          primary_contact_id: formData.linked_contact_id,
          related_contact_id: newContact.id,
          relationship_type: formData.relationship_type,
          is_emergency_contact: true
        };

        const { error: relationshipError } = await supabase
          .from('family_relationships')
          .insert([relationshipData]);

        if (relationshipError) {
          console.error('Error creating family relationship:', relationshipError);
          // Don't fail the contact creation, just warn
          toast({
            title: "Warning",
            description: "Contact created but family relationship could not be established",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: `${newContact.first_name} ${newContact.last_name} has been added successfully!`,
      });

      // Update the contacts list
      fetchContacts();
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      });
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication required');
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update contacts",
          variant: "destructive",
        });
        return;
      }

      console.log('Updating contact with session:', session.user.email);
      console.log('Form data:', formData);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', selectedContact.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No rows updated - check if you have permission to modify this contact');
      }

      const updatedContact = data[0];
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setContacts(contacts.map(c => c.id === selectedContact.id ? updatedContact : c));
      setShowEditDialog(false);
      setSelectedContact(null);
      resetForm();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contact",
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
      membership_status: contact.membership_status,
      relationship_type: "none",
      linked_contact_id: undefined
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

  const handleAssignMembership = (contact: Contact) => {
    setSelectedContact(contact);
    setShowMembershipDialog(true);
  };

  const handleMembershipSuccess = () => {
    fetchContacts(); // Refresh the contacts list
    toast({
      title: "Membership Assigned",
      description: "Membership has been successfully assigned and payment processed",
    });
  };

  const handleContactClick = (contact: Contact) => {
    navigate(`/contacts/${contact.id}`);
  };

  // Enhanced ContactForm is now imported from separate component

  if (contactsLoading) {
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
                Manage academy members and their family relationships
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'family' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('family')}
                className="rounded-l-none"
              >
                <Users className="h-4 w-4" />
              </Button>
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
                <EnhancedContactForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  contacts={contacts}
                  mode="add"
                />
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

        {/* Enhanced Filters */}
        <ContactFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterRole={filterRole}
          onFilterRoleChange={setFilterRole}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          showFamiliesOnly={showFamiliesOnly}
          onShowFamiliesOnlyChange={setShowFamiliesOnly}
          contacts={organizeContacts.allFiltered}
        />

        {/* Contacts Display */}
        <div className="mt-6">
          {viewMode === 'family' ? (
            // Family Hierarchy View
            <div className="space-y-6">
              {organizeContacts.families.map(({ parent, children }) => (
                <Card key={parent.id} className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle>{parent.first_name} {parent.last_name} Family</CardTitle>
                        <Badge variant="outline">{children.length + 1} members</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewFamily(parent)}
                      >
                        View Family Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <ContactCard
                        contact={parent}
                        children={children}
                        onView={handleViewContact}
                        onEdit={handleEditContactClick}
                        onAddChild={handleAddChild}
                        onViewFamily={handleViewFamily}
                        onAssignMembership={handleAssignMembership}
                      />
                      {children.slice(0, 2).map((child) => (
                        <ContactCard
                          key={child.id}
                          contact={child}
                          onView={handleViewContact}
                          onEdit={handleEditContactClick}
                          onAddChild={handleAddChild}
                          onViewFamily={handleViewFamily}
                          onAssignMembership={handleAssignMembership}
                        />
                      ))}
                      {children.length > 2 && (
                        <div className="ml-4 p-3 border rounded-lg bg-muted text-muted-foreground text-sm">
                          +{children.length - 2} more children. Click "View Family Details" to see all.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {organizeContacts.individualContacts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Individual Contacts</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {organizeContacts.individualContacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onView={handleViewContact}
                        onEdit={handleEditContactClick}
                        onAddChild={handleAddChild}
                        onViewFamily={handleViewFamily}
                        onAssignMembership={handleAssignMembership}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'list' ? (
            // Table View
            <ContactsTable
              contacts={organizeContacts.allFiltered}
              onView={handleViewContact}
              onEdit={handleEditContactClick}
              onAddChild={handleAddChild}
              onViewFamily={handleViewFamily}
              onContactClick={handleContactClick}
              selectedContactIds={selectedContactIds}
              onSelectionChange={setSelectedContactIds}
              filterRole={filterRole}
              onFilterRoleChange={setFilterRole}
              allContacts={contacts}
              searchTerm={searchTerm}
              showFamiliesOnly={showFamiliesOnly}
            />
          ) : (
            // Grid View
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizeContacts.allFiltered.map((contact) => {
                const children = contacts.filter(child => child.parent_id === contact.id);
                return (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    children={children}
                    onView={handleViewContact}
                    onEdit={handleEditContactClick}
                    onAddChild={handleAddChild}
                    onViewFamily={handleViewFamily}
                    onAssignMembership={handleAssignMembership}
                  />
                );
              })}
            </div>
          )}
        </div>


        {/* Dialogs */}
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

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update contact information
              </DialogDescription>
            </DialogHeader>
            <EnhancedContactForm 
              formData={formData} 
              setFormData={setFormData} 
              contacts={contacts}
              mode="edit"
            />
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

        <AddChildDialog
          open={showAddChildDialog}
          onClose={() => setShowAddChildDialog(false)}
          parentContact={selectedContact}
          onChildAdded={handleChildAdded}
        />

        <FamilyHierarchy
          open={showFamilyDialog}
          onClose={() => setShowFamilyDialog(false)}
          primaryContact={selectedContact}
          familyMembers={contacts.filter(c => c.parent_id === selectedContact?.id)}
          onEdit={handleEditContactClick}
          onView={handleViewContact}
          onAddChild={handleAddChild}
        />

        {/* Temporarily commenting out AssignMembershipDialog until we fix the issue */}
        {/* 
        <AssignMembershipDialog
          contact={selectedContact}
          open={showMembershipDialog}
          onOpenChange={setShowMembershipDialog}
          onSuccess={handleMembershipSuccess}
        />
        */}

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedContactIds={selectedContactIds}
          onClearSelection={() => setSelectedContactIds([])}
          onActionComplete={fetchContacts}
        />
      </div>
    </div>
  );
};

export default Contacts;