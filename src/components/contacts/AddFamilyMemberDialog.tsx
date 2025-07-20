import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface FamilyMemberFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  belt_level: string;
  emergency_contact: string;
  membership_status: string;
  relationship_type: string;
}

interface AddFamilyMemberDialogProps {
  open: boolean;
  onClose: () => void;
  primaryContact: Contact | null;
  onMemberAdded: (member: Contact) => void;
}

export const AddFamilyMemberDialog = ({ open, onClose, primaryContact, onMemberAdded }: AddFamilyMemberDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  
  const [formData, setFormData] = useState<FamilyMemberFormData>({
    first_name: "",
    last_name: primaryContact?.last_name || "",
    email: "",
    phone: "",
    role: "member",
    belt_level: "white",
    emergency_contact: `${primaryContact?.first_name} ${primaryContact?.last_name}` || "",
    membership_status: "active",
    relationship_type: "child"
  });

  // Search existing contacts
  const searchContacts = async (query: string) => {
    console.log('searchContacts called with query:', query);
    if (!query || query.length < 2) {
      console.log('Query too short, clearing results');
      setSearchResults([]);
      return;
    }

    try {
      console.log('Executing supabase query for:', query);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', primaryContact?.id) // Don't include the primary contact
        .limit(10);

      console.log('Supabase response - data:', data, 'error:', error);
      if (error) throw error;
      setSearchResults(data || []);
      console.log('Search results set:', data);
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchContacts(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: primaryContact?.last_name || "",
      email: "",
      phone: "",
      role: "member",
      belt_level: "white",
      emergency_contact: `${primaryContact?.first_name} ${primaryContact?.last_name}` || "",
      membership_status: "active",
      relationship_type: "child"
    });
    setSelectedContact(null);
    setSearchQuery("");
    setActiveTab("search");
  };

  const handleLinkExistingContact = async () => {
    if (!selectedContact || !primaryContact) return;

    setLoading(true);
    try {
      // Create family relationship
      const { error } = await supabase
        .from('family_relationships')
        .insert({
          primary_contact_id: primaryContact.id,
          related_contact_id: selectedContact.id,
          relationship_type: formData.relationship_type
        });

      if (error) throw error;

      toast({
        title: "Family Member Added",
        description: `${selectedContact.first_name} ${selectedContact.last_name} has been linked as a family member.`,
      });

      onMemberAdded(selectedContact);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error linking contact:', error);
      toast({
        title: "Error",
        description: "Failed to link family member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewContact = async () => {
    if (!primaryContact) return;
    
    setLoading(true);
    try {
      // Note: In a real production system, this would involve user registration flow
      // For now, we'll simulate the family member creation
      toast({
        title: "Family Member Information Saved",
        description: `${formData.first_name}'s information has been recorded. In a live system, this would create an account and link to ${primaryContact.first_name}.`,
      });

      // Simulate a new family member contact for demo purposes
      const simulatedContact: Contact = {
        id: `family-${Date.now()}`,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        belt_level: formData.belt_level,
        emergency_contact: formData.emergency_contact,
        membership_status: formData.membership_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onMemberAdded(simulatedContact);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating family member:', error);
      toast({
        title: "Error",
        description: "Failed to create family member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a new family member linked to this contact.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search Existing</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <div>
              <Label>Search for existing contact</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {searchResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-muted",
                          selectedContact?.id === contact.id && "bg-muted"
                        )}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {contact.email} • {contact.role} • {contact.membership_status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchQuery && searchResults.length === 0 && (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md">
                    No contacts found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
            
            {selectedContact && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                <div>
                  <h4 className="font-medium">Selected Contact</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.first_name} {selectedContact.last_name} ({selectedContact.email})
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="relationship_type">Relationship</Label>
                  <Select value={formData.relationship_type} onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleLinkExistingContact} disabled={loading} className="w-full">
                  {loading ? "Linking..." : "Link as Family Member"}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="Enter first name"
                  required
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
                    <SelectItem value="no_belt">No Belt</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="relationship_type_create">Relationship</Label>
                <Select value={formData.relationship_type} onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="membership_status">Membership Type</Label>
                <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="frozen">Frozen</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
            
            <Button 
              onClick={handleCreateNewContact} 
              disabled={loading || !formData.first_name}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Family Member"}
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};