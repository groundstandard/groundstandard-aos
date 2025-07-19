import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, UserCheck, UserMinus, GraduationCap, Edit2, Trash2, Plus, Download, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  belt_level: string | null;
  membership_status: string;
  created_at: string;
}

export const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    belt_level: "",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Frozen</Badge>;
      case 'alumni':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Alumni</Badge>;
      default:
        return <Badge variant="outline">Visitor</Badge>;
    }
  };

  const getFilteredContacts = (filter: string) => {
    let filtered = contacts;
    
    switch (filter) {
      case 'visitors':
        filtered = contacts.filter(c => !c.membership_status || c.membership_status === 'visitor');
        break;
      case 'active':
        filtered = contacts.filter(c => c.membership_status === 'active');
        break;
      case 'frozen':
        filtered = contacts.filter(c => c.membership_status === 'inactive');
        break;
      case 'alumni':
        filtered = contacts.filter(c => c.membership_status === 'alumni');
        break;
      default:
        filtered = contacts;
    }

    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getContactCounts = () => {
    return {
      all: contacts.length,
      visitors: contacts.filter(c => !c.membership_status || c.membership_status === 'visitor').length,
      active: contacts.filter(c => c.membership_status === 'active').length,
      frozen: contacts.filter(c => c.membership_status === 'inactive').length,
      alumni: contacts.filter(c => c.membership_status === 'alumni').length,
    };
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || "",
      belt_level: contact.belt_level || "",
      membership_status: contact.membership_status
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', editingContact.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      fetchContacts();
      setIsEditDialogOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', Array.from(selectedContacts));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.size} contacts deleted successfully`,
      });

      fetchContacts();
      setSelectedContacts(new Set());
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedContacts.size === 0) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ membership_status: newStatus })
        .in('id', Array.from(selectedContacts));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.size} contacts updated successfully`,
      });

      fetchContacts();
      setSelectedContacts(new Set());
    } catch (error) {
      console.error('Error updating contacts:', error);
      toast({
        title: "Error",
        description: "Failed to update contacts",
        variant: "destructive",
      });
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleSelectAll = (contacts: Contact[]) => {
    const contactIds = contacts.map(c => c.id);
    const allSelected = contactIds.every(id => selectedContacts.has(id));
    
    if (allSelected) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set([...selectedContacts, ...contactIds]));
    }
  };

  const exportContacts = (contacts: Contact[]) => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Belt Level', 'Status', 'Joined'],
      ...contacts.map(c => [
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone || '',
        c.belt_level || '',
        c.membership_status,
        new Date(c.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const ContactTable = ({ contacts }: { contacts: Contact[] }) => {
    const contactIds = contacts.map(c => c.id);
    const allSelected = contactIds.length > 0 && contactIds.every(id => selectedContacts.has(id));
    const someSelected = contactIds.some(id => selectedContacts.has(id));

    return (
      <div className="space-y-4">
        {/* Bulk Actions */}
        {selectedContacts.size > 0 && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedContacts.size} contact{selectedContacts.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Frozen</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contacts</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedContacts.size} contact{selectedContacts.size === 1 ? '' : 's'}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleSelectAll(contacts)}
                  className={someSelected && !allSelected ? "data-[state=checked]:bg-muted" : ""}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Belt Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.has(contact.id)}
                    onCheckedChange={() => toggleContactSelection(contact.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {contact.first_name} {contact.last_name}
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone || 'N/A'}</TableCell>
                <TableCell>{contact.belt_level || 'N/A'}</TableCell>
                <TableCell>{getStatusBadge(contact.membership_status)}</TableCell>
                <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {contact.first_name} {contact.last_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteContact(contact.id)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  const counts = getContactCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contact Management</h2>
          <p className="text-muted-foreground">View and manage all contacts in the system</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => exportContacts(getFilteredContacts(activeTab))} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{counts.all}</div>
            <div className="text-sm text-muted-foreground">Total Contacts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{counts.active}</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserMinus className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{counts.frozen}</div>
            <div className="text-sm text-muted-foreground">Frozen Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{counts.alumni}</div>
            <div className="text-sm text-muted-foreground">Alumni</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <div className="text-2xl font-bold">{counts.visitors}</div>
            <div className="text-sm text-muted-foreground">Visitors</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
              <TabsTrigger value="frozen">Frozen ({counts.frozen})</TabsTrigger>
              <TabsTrigger value="alumni">Alumni ({counts.alumni})</TabsTrigger>
              <TabsTrigger value="visitors">Visitors ({counts.visitors})</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="all">
                <ContactTable contacts={getFilteredContacts('all')} />
              </TabsContent>
              <TabsContent value="active">
                <ContactTable contacts={getFilteredContacts('active')} />
              </TabsContent>
              <TabsContent value="frozen">
                <ContactTable contacts={getFilteredContacts('frozen')} />
              </TabsContent>
              <TabsContent value="alumni">
                <ContactTable contacts={getFilteredContacts('alumni')} />
              </TabsContent>
              <TabsContent value="visitors">
                <ContactTable contacts={getFilteredContacts('visitors')} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="belt_level">Belt Level</Label>
              <Select value={formData.belt_level} onValueChange={(value) => setFormData({...formData, belt_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select belt level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="white">White Belt</SelectItem>
                  <SelectItem value="yellow">Yellow Belt</SelectItem>
                  <SelectItem value="orange">Orange Belt</SelectItem>
                  <SelectItem value="green">Green Belt</SelectItem>
                  <SelectItem value="blue">Blue Belt</SelectItem>
                  <SelectItem value="purple">Purple Belt</SelectItem>
                  <SelectItem value="brown">Brown Belt</SelectItem>
                  <SelectItem value="black">Black Belt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership_status">Membership Status</Label>
              <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Frozen</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};