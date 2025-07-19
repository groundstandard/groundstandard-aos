import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, UserCheck, UserMinus, GraduationCap } from "lucide-react";
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

  const ContactTable = ({ contacts }: { contacts: Contact[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Belt Level</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">
              {contact.first_name} {contact.last_name}
            </TableCell>
            <TableCell>{contact.email}</TableCell>
            <TableCell>{contact.phone || 'N/A'}</TableCell>
            <TableCell>{contact.belt_level || 'N/A'}</TableCell>
            <TableCell>{getStatusBadge(contact.membership_status)}</TableCell>
            <TableCell>{new Date(contact.created_at).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
    </div>
  );
};