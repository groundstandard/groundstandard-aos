import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EnhancedAssignMembershipDialog } from "./EnhancedAssignMembershipDialog";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, DollarSign, Calendar, Users } from "lucide-react";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  membership_status: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  base_price_cents: number;
  billing_cycle: string;
  classes_per_week: number;
  is_unlimited: boolean;
  trial_days: number;
  setup_fee_cents: number;
}

interface AssignMembershipDialogProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignMembershipDialog = ({ contact, open, onOpenChange, onSuccess }: AssignMembershipDialogProps) => {
  // Use the enhanced dialog instead
  return (
    <EnhancedAssignMembershipDialog
      contact={contact}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
};