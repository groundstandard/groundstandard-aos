import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface EnhancedContactFormProps {
  formData: ContactFormData;
  setFormData: (data: ContactFormData) => void;
  contacts?: Contact[];
  mode?: 'add' | 'edit';
}

export const EnhancedContactForm = ({ 
  formData, 
  setFormData, 
  contacts = [], 
  mode = 'add' 
}: EnhancedContactFormProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");

  // Search existing contacts for family linking
  const searchContacts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
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

  const handleContactSelection = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      ...formData,
      linked_contact_id: contact.id,
      last_name: contact.last_name, // Auto-fill last name for family members
      emergency_contact: `${contact.first_name} ${contact.last_name}`
    });
    setSearchOpen(false);
  };

  const clearSelectedContact = () => {
    setSelectedContact(null);
    setFormData({
      ...formData,
      linked_contact_id: undefined,
      relationship_type: "none"
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="individual">Individual Contact</TabsTrigger>
        <TabsTrigger value="family">Family Member</TabsTrigger>
      </TabsList>
      
      <TabsContent value="individual" className="space-y-4">
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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
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
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={formData.relationship_type} onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="none">N/A</SelectItem>
                <SelectItem value="head_of_house">Head of House</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="belt_level">Belt Level</Label>
            <Select value={formData.belt_level} onValueChange={(value) => setFormData({...formData, belt_level: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select belt level" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="none">No Belt</SelectItem>
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
            <Label htmlFor="emergency_contact">Emergency Contact</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
              placeholder="Enter emergency contact"
            />
          </div>
          <div>
            <Label htmlFor="membership_status">Status</Label>
            <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="family" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Link to Existing Contact</Label>
            <div className="space-y-2">
              {!selectedContact ? (
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={searchOpen}
                      className="w-full justify-between"
                    >
                      Search for family member...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white z-50">
                    <Command>
                      <CommandInput
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandEmpty>No contacts found.</CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {searchResults.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={`${contact.first_name} ${contact.last_name} ${contact.email}`}
                              onSelect={() => handleContactSelection(contact)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {contact.email} • {contact.role} • {contact.membership_status}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="p-3 border rounded-md bg-muted/50 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedContact.email} • {selectedContact.role}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearSelectedContact}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>

          {selectedContact && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name_family">First Name *</Label>
                  <Input
                    id="first_name_family"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name_family">Last Name</Label>
                  <Input
                    id="last_name_family"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email_family">Email</Label>
                  <Input
                    id="email_family"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone_family">Phone</Label>
                  <Input
                    id="phone_family"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="role_family">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
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
                  <Label htmlFor="relationship_family">Relationship *</Label>
                  <Select value={formData.relationship_type} onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="head_of_house">Head of House</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="belt_level_family">Belt Level</Label>
                  <Select value={formData.belt_level} onValueChange={(value) => setFormData({...formData, belt_level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select belt level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="none">No Belt</SelectItem>
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
                  <Label htmlFor="emergency_contact_family">Emergency Contact</Label>
                  <Input
                    id="emergency_contact_family"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                    placeholder="Enter emergency contact"
                  />
                </div>
                <div>
                  <Label htmlFor="membership_status_family">Status</Label>
                  <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};