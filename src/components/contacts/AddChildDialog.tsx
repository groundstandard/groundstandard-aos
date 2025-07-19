import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface ChildFormData {
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

interface AddChildDialogProps {
  open: boolean;
  onClose: () => void;
  parentContact: Contact | null;
  onChildAdded: (child: Contact) => void;
}

export const AddChildDialog = ({ open, onClose, parentContact, onChildAdded }: AddChildDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChildFormData>({
    first_name: "",
    last_name: parentContact?.last_name || "",
    email: "",
    phone: "",
    role: "member",
    belt_level: "white",
    emergency_contact: `${parentContact?.first_name} ${parentContact?.last_name}` || "",
    membership_status: "active",
    relationship_type: "child"
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: parentContact?.last_name || "",
      email: "",
      phone: "",
      role: "member",
      belt_level: "white",
      emergency_contact: `${parentContact?.first_name} ${parentContact?.last_name}` || "",
      membership_status: "active",
      relationship_type: "child"
    });
  };

  const handleAddChild = async () => {
    if (!parentContact) return;
    
    setLoading(true);
    try {
      // Note: In a real system, children would be added through user registration
      // For demo purposes, we'll show a success message
      toast({
        title: "Child Contact Information Saved",
        description: `${formData.first_name}'s information has been recorded. In a live system, this would create a child account linked to ${parentContact.first_name}.`,
      });

      // Simulate a new child contact for demo purposes
      const simulatedChild = {
        id: `child-${Date.now()}`,
        ...formData,
        parent_id: parentContact.id,
        email: formData.email || `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@family.academy`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onChildAdded(simulatedChild as any);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding child:', error);
      toast({
        title: "Error",
        description: "Failed to add child contact",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Child Contact</DialogTitle>
          <DialogDescription>
            Add a child contact for {parentContact?.first_name} {parentContact?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="child_first_name">First Name *</Label>
              <Input
                id="child_first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="child_last_name">Last Name</Label>
              <Input
                id="child_last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="child_email">Email (Optional)</Label>
            <Input
              id="child_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter email or leave blank for auto-generated"
            />
          </div>

          <div>
            <Label htmlFor="child_phone">Phone</Label>
            <Input
              id="child_phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="child_role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="child_belt_level">Belt Level</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="relationship_type">Relationship</Label>
              <Select value={formData.relationship_type} onValueChange={(value) => setFormData({...formData, relationship_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="son">Son</SelectItem>
                  <SelectItem value="daughter">Daughter</SelectItem>
                  <SelectItem value="stepchild">Stepchild</SelectItem>
                  <SelectItem value="ward">Ward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="child_status">Membership Status</Label>
              <Select value={formData.membership_status} onValueChange={(value) => setFormData({...formData, membership_status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="child_emergency">Emergency Contact</Label>
            <Input
              id="child_emergency"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
              placeholder="Enter emergency contact"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddChild} 
            disabled={loading || !formData.first_name}
          >
            {loading ? "Adding..." : "Add Child"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};