import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon,
  Award,
  Users,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Edit,
  Receipt,
  Target,
  UserPlus
} from "lucide-react";
import { AddFamilyMemberDialog } from "@/components/contacts/AddFamilyMemberDialog";
import { ActiveMembershipCard } from "@/components/contacts/ActiveMembershipCard";
import { ClassPacksCard } from "@/components/contacts/ClassPacksCard";
import GroupedPaymentHistory from "@/components/contacts/GroupedPaymentHistory";
import PaymentDetailModal from "@/components/contacts/PaymentDetailModal";
import AttendanceEditModal from "@/components/contacts/AttendanceEditModal";
import { StudentPaymentIntegration } from "@/components/payments/StudentPaymentIntegration";

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

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  payment_method?: string;
  description?: string;
  student_id: string;
  stripe_invoice_id?: string;
  payment_method_type?: string;
  ach_bank_name?: string;
  ach_last4?: string;
  tax_amount?: number;
  subtotal_amount?: number;
  applied_credits?: number;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  notes?: string;
  class_id: string;
  student_id: string;
  created_at: string;
  classes?: {
    name: string;
  };
}

interface MembershipPlan {
  id: string;
  name: string;
  base_price_cents: number;
  billing_cycle: string;
  description?: string;
  is_active: boolean;
}

interface ContactNote {
  id: string;
  contact_id: string;
  title: string;
  content?: string;
  note_type: string;
  priority: string;
  is_private: boolean;
  created_by?: string;
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

const ContactProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Contact[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showAddFamilyDialog, setShowAddFamilyDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<ContactNote | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMarkAttendanceDialog, setShowMarkAttendanceDialog] = useState(false);
  const [markAttendanceData, setMarkAttendanceData] = useState({
    class_id: '',
    date: undefined as Date | undefined,
    status: 'present' as 'present' | 'absent' | 'late' | 'excused',
    notes: ''
  });
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string; name: string; class_schedules?: Array<{day_of_week: number; start_time: string; end_time: string}>}>>([]);
  const [classSchedules, setClassSchedules] = useState<Array<{day_of_week: number; start_time: string; end_time: string}>>([]);
  const [showCalendar, setShowCalendar] = useState(false);
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
  const [noteFormData, setNoteFormData] = useState({
    title: "",
    content: "",
    note_type: "general",
    priority: "normal",
    is_private: false
  });

  useEffect(() => {
    if (id) {
      fetchContactData(id);
    }
  }, [id]);

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone || "",
        role: contact.role,
        belt_level: contact.belt_level || "none", // Convert empty string to "none"
        emergency_contact: contact.emergency_contact || "",
        membership_status: contact.membership_status
      });
    }
  }, [contact]);

  const fetchContactData = async (contactId: string) => {
    try {
      setLoading(true);

      // Fetch contact details
      const { data: contactData, error: contactError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;
      setContact(contactData);

      // Fetch family members (if this contact is a parent)
      const { data: familyData } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', contactId);

      setFamilyMembers(familyData || []);

      // Fetch comprehensive payment history with related data
      const { data: paymentData } = await supabase
        .from('payments')
        .select(`
          *,
          billing_cycles (
            id,
            cycle_start_date,
            cycle_end_date,
            status
          )
        `)
        .eq('student_id', contactId)
        .order('payment_date', { ascending: false });

      setPayments(paymentData || []);

      // Fetch attendance history
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          *,
          classes(name)
        `)
        .eq('student_id', contactId)
        .order('date', { ascending: false })
        .limit(50);

      setAttendance(attendanceData || []);

      // Fetch available membership plans
      const { data: plansData } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true);

      setMembershipPlans(plansData || []);

      // Fetch contact notes
      const { data: notesData } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      setContactNotes(notesData || []);

      // Fetch available classes for attendance marking with their schedules
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          id, 
          name,
          class_schedules(day_of_week, start_time, end_time)
        `)
        .eq('is_active', true)
        .order('name');

      setAvailableClasses(classesData || []);

    } catch (error) {
      console.error('Error fetching contact data:', error);
      toast({
        title: "Error",
        description: "Failed to load contact information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (planId: string, amount: number, description: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId,
          amount,
          description,
          paymentType: 'payment'
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Payment Link Created",
          description: "Opening payment window...",
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to create payment link",
        variant: "destructive",
      });
    }
  };

  const handleEditContact = async () => {
    if (!contact) return;

    try {
      // Convert "none" back to empty string for belt_level
      const updateData = {
        ...formData,
        belt_level: formData.belt_level === "none" ? "" : formData.belt_level
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', contact.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No rows updated - check if you have permission to modify this contact');
      }

      const updatedContact = data[0];
      setContact(updatedContact);
      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setShowEditDialog(false);
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = () => {
    setShowEditDialog(true);
  };

  const handleAddNote = async () => {
    if (!contact) return;

    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contact.id,
          ...noteFormData,
          created_by: profile?.id
        })
        .select()
        .single();

      if (error) throw error;

      setContactNotes([data, ...contactNotes]);
      setNoteFormData({
        title: "",
        content: "",
        note_type: "general",
        priority: "normal",
        is_private: false
      });
      setShowAddNoteDialog(false);
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = async () => {
    if (!editingNote) return;

    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .update(noteFormData)
        .eq('id', editingNote.id)
        .select()
        .single();

      if (error) throw error;

      setContactNotes(contactNotes.map(note => 
        note.id === editingNote.id ? data : note
      ));
      setEditingNote(null);
      setNoteFormData({
        title: "",
        content: "",
        note_type: "general",
        priority: "normal",
        is_private: false
      });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setContactNotes(contactNotes.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleClassSelection = (classId: string) => {
    setMarkAttendanceData({...markAttendanceData, class_id: classId});
    
    // Find the selected class and set its schedules
    const selectedClass = availableClasses.find(cls => cls.id === classId);
    if (selectedClass && selectedClass.class_schedules) {
      setClassSchedules(selectedClass.class_schedules);
    } else {
      setClassSchedules([]);
    }
  };

  const getDisabledDates = (date: Date) => {
    if (!markAttendanceData.class_id || classSchedules.length === 0) {
      return false; // Allow all dates if no class selected
    }
    
    const dayOfWeek = date.getDay();
    return !classSchedules.some(schedule => schedule.day_of_week === dayOfWeek);
  };

  const handleMarkAttendance = async () => {
    if (!contact || !markAttendanceData.class_id || !markAttendanceData.date) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: contact.id,
          class_id: markAttendanceData.class_id,
          date: markAttendanceData.date.toISOString().split('T')[0], // Convert Date to string
          status: markAttendanceData.status,
          notes: markAttendanceData.notes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });

      // Refresh attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          *,
          classes(name)
        `)
        .eq('student_id', contact.id)
        .order('date', { ascending: false })
        .limit(50);

      setAttendance(attendanceData || []);
      setShowMarkAttendanceDialog(false);
      setMarkAttendanceData({
        class_id: '',
        date: undefined,
        status: 'present',
        notes: ''
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const handleAttendanceUpdate = () => {
    // Refresh attendance data after update
    if (contact) {
      const fetchUpdatedAttendance = async () => {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            *,
            classes(name)
          `)
          .eq('student_id', contact.id)
          .order('date', { ascending: false })
          .limit(50);

        setAttendance(attendanceData || []);
      };
      fetchUpdatedAttendance();
    }
  };

  // Family member addition is now handled by the AddFamilyMemberDialog component
  // This function can be removed as it's no longer needed

  const startEditNote = (note: ContactNote) => {
    setEditingNote(note);
    setNoteFormData({
      title: note.title,
      content: note.content || "",
      note_type: note.note_type,
      priority: note.priority,
      is_private: note.is_private
    });
  };

  const getInitials = (contact: Contact) => {
    return `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'active':
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTotalPaid = () => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getOutstandingBalance = () => {
    return payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getAttendanceRate = () => {
    if (attendance.length === 0) return 0;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'medical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'behavioral':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'emergency':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'payment':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'attendance':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'family':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <div>Loading contact profile...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <BackButton />
            <div>Contact not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              Contact Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage academy members and their family relationships
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Contact
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="card-minimal shadow-elegant mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shadow-soft">
                <AvatarImage src="" alt={`${contact.first_name} ${contact.last_name}`} />
                <AvatarFallback className="text-lg font-semibold bg-muted">
                  {getInitials(contact)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold text-foreground">
                    {contact.first_name} {contact.last_name}
                  </h2>
                  <Badge variant="outline" className={getStatusColor(contact.membership_status)}>
                    {contact.membership_status}
                  </Badge>
                  <Badge variant="secondary">
                    {contact.role}
                  </Badge>
                  {contact.belt_level && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {contact.belt_level} Belt
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Joined {new Date(contact.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gradient-subtle rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{formatCurrency(getTotalPaid())}</div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{formatCurrency(getOutstandingBalance())}</div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{getAttendanceRate()}%</div>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{familyMembers.length}</div>
                    <p className="text-xs text-muted-foreground">Family Members</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              {/* Active Membership Section */}
              <ActiveMembershipCard contactId={contact?.id} />
              
              {/* Class Packs Section */}
              <ClassPacksCard contactId={contact?.id} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Payments */}
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Recent Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
                        <div 
                          key={payment.id} 
                          className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded p-2 transition-colors"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowPaymentModal(true);
                          }}
                        >
                          <div>
                            <p className="font-medium">{payment.description || 'Payment'}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Attendance */}
                <Card className="card-minimal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recent Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-3">
                       {attendance.slice(0, 10).map((record) => (
                         <div 
                           key={record.id} 
                           className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded p-2 transition-colors"
                           onClick={() => {
                             setSelectedAttendance(record);
                             setShowAttendanceModal(true);
                           }}
                         >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium">
                                  {new Date(record.date).toLocaleDateString()}
                                </p>
                                {record.classes?.name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {record.classes.name}
                                  </Badge>
                                )}
                              </div>
                              {record.notes && (
                                <p className="text-xs text-muted-foreground">{record.notes}</p>
                              )}
                            </div>
                           <Badge variant="outline" className={getStatusColor(record.status)}>
                             {record.status}
                           </Badge>
                         </div>
                       ))}
                       {attendance.length === 0 && (
                         <p className="text-muted-foreground text-center py-4">No attendance recorded</p>
                       )}
                     </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Payment Actions */}
              <Card className="card-minimal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {membershipPlans.map((plan) => (
                    <Button
                      key={plan.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => handleCreatePayment(plan.id, plan.base_price_cents, plan.name)}
                    >
                      <span>{plan.name}</span>
                      <span>{formatCurrency(plan.base_price_cents)}</span>
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCreatePayment('', 2500, 'Custom Payment')}
                  >
                    Custom Amount
                  </Button>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="card-minimal lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GroupedPaymentHistory
                    payments={payments}
                    onPaymentUpdated={() => {
                      // Refresh payment data
                      if (contact?.id) {
                        fetchContactData(contact.id);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="card-minimal">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Attendance History
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMarkAttendanceDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendance.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        setSelectedAttendance(record);
                        setShowAttendanceModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          record.status === 'present' ? 'bg-green-100' : 
                          record.status === 'late' ? 'bg-yellow-100' :
                          record.status === 'excused' ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          {record.status === 'present' ? 
                            <CheckCircle className="h-4 w-4 text-green-600" /> :
                            record.status === 'late' ?
                            <Clock className="h-4 w-4 text-yellow-600" /> :
                            record.status === 'excused' ?
                            <AlertCircle className="h-4 w-4 text-blue-600" /> :
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No attendance records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-4">
            <Card className="card-minimal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddFamilyDialog(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Family Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(member)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(member.membership_status)}>
                          {member.membership_status}
                        </Badge>
                        {member.belt_level && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            {member.belt_level}
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/contacts/${member.id}`)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                  {familyMembers.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No family members</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card className="card-minimal">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    📝 Contact Notes
                  </CardTitle>
                  <Button onClick={() => setShowAddNoteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contactNotes.map((note) => (
                    <div key={note.id} className={`p-4 border rounded-lg ${getNoteTypeColor(note.note_type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{note.title}</h4>
                            <Badge variant="outline" className={getPriorityColor(note.priority)}>
                              {note.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {note.note_type}
                            </Badge>
                            {note.is_private && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                Private
                              </Badge>
                            )}
                          </div>
                          {note.content && (
                            <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => startEditNote(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {contactNotes.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No notes recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Note Dialog */}
        <Dialog open={showAddNoteDialog || !!editingNote} onOpenChange={(open) => {
          if (!open) {
            setShowAddNoteDialog(false);
            setEditingNote(null);
            setNoteFormData({
              title: "",
              content: "",
              note_type: "general",
              priority: "normal",
              is_private: false
            });
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
              <DialogDescription>
                {editingNote ? 'Update the note information.' : 'Add a new note for this contact.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteFormData.title}
                  onChange={(e) => setNoteFormData({...noteFormData, title: e.target.value})}
                  placeholder="Enter note title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-type">Type</Label>
                  <Select 
                    value={noteFormData.note_type} 
                    onValueChange={(value) => setNoteFormData({...noteFormData, note_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="note-priority">Priority</Label>
                  <Select 
                    value={noteFormData.priority} 
                    onValueChange={(value) => setNoteFormData({...noteFormData, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={noteFormData.content}
                  onChange={(e) => setNoteFormData({...noteFormData, content: e.target.value})}
                  placeholder="Enter note content..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="note-private"
                  checked={noteFormData.is_private}
                  onChange={(e) => setNoteFormData({...noteFormData, is_private: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="note-private">Private note (visible only to admins)</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowAddNoteDialog(false);
                setEditingNote(null);
              }}>
                Cancel
              </Button>
              <Button onClick={editingNote ? handleEditNote : handleAddNote}>
                {editingNote ? 'Update Note' : 'Add Note'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mark Attendance Dialog */}
        <Dialog open={showMarkAttendanceDialog} onOpenChange={setShowMarkAttendanceDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Mark attendance for {contact?.first_name} {contact?.last_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="class">Class</Label>
                <Select 
                  value={markAttendanceData.class_id} 
                  onValueChange={handleClassSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Date</Label>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !markAttendanceData.date && "text-muted-foreground"
                    )}
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {markAttendanceData.date ? format(markAttendanceData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                  
                  {/* Inline calendar within modal */}
                  {showCalendar && (
                    <div className="mt-2 border rounded-md">
                      <Calendar
                        mode="single"
                        selected={markAttendanceData.date}
                        onSelect={(date) => {
                          setMarkAttendanceData({...markAttendanceData, date});
                          setShowCalendar(false); // Hide calendar after selection
                        }}
                        disabled={getDisabledDates}
                        className={cn("p-3")}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={markAttendanceData.status} 
                  onValueChange={(value: 'present' | 'absent' | 'late' | 'excused') => 
                    setMarkAttendanceData({...markAttendanceData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={markAttendanceData.notes}
                  onChange={(e) => setMarkAttendanceData({...markAttendanceData, notes: e.target.value})}
                  placeholder="Add any notes about this attendance..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMarkAttendanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAttendance}>
                Mark Attendance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attendance Edit Modal */}
        {selectedAttendance && (
          <AttendanceEditModal
            attendance={selectedAttendance}
            open={showAttendanceModal}
            onOpenChange={setShowAttendanceModal}
            onAttendanceUpdated={handleAttendanceUpdate}
          />
        )}

        {/* Add Family Member Dialog */}
        <AddFamilyMemberDialog
          open={showAddFamilyDialog}
          onClose={() => setShowAddFamilyDialog(false)}
          primaryContact={contact}
          onMemberAdded={(member) => {
            setFamilyMembers([...familyMembers, member]);
            toast({
              title: "Success",
              description: "Family member added successfully",
            });
          }}
        />

        {/* Edit Contact Dialog */}

        {/* Edit Contact Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Make changes to the contact information. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
                  <SelectContent>
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

        {/* Payment Detail Modal */}
        <PaymentDetailModal
          payment={selectedPayment}
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onPaymentUpdated={() => {
            // Refresh payment data
            if (contact?.id) {
              fetchContactData(contact.id);
            }
          }}
        />

        {/* Attendance Edit Modal */}
        <AttendanceEditModal
          attendance={selectedAttendance}
          open={showAttendanceModal}
          onOpenChange={setShowAttendanceModal}
          onAttendanceUpdated={() => {
            // Refresh attendance data
            if (contact?.id) {
              fetchContactData(contact.id);
            }
          }}
        />
      </div>
    </div>
  );
};

export default ContactProfile;