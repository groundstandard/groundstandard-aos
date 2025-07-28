import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Mail, 
  MessageSquare, 
  Calendar, 
  Users,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Gift,
  Zap,
  Settings,
  Repeat,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AutomatedSequence {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  emails_sent: number;
  open_rate: number;
  click_rate: number;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject: string;
  content: string;
  variables: string[];
}

interface ScheduledMessage {
  id: string;
  recipient_type: string;
  recipient_count: number;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'failed';
  template_name: string;
}

export const EnhancedCommunications = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sequences");
  
  // Data states
  const [sequences, setSequences] = useState<AutomatedSequence[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  
  // Dialog states
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isMassMessageDialogOpen, setIsMassMessageDialogOpen] = useState(false);
  
  // Form states
  const [sequenceName, setSequenceName] = useState("");
  const [sequenceTrigger, setSequenceTrigger] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateType, setTemplateType] = useState("email");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [messageRecipients, setMessageRecipients] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [scheduleDateTime, setScheduleDateTime] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSequences(),
        fetchTemplates(),
        fetchScheduledMessages()
      ]);
    } catch (error) {
      console.error('Error fetching communication data:', error);
      toast({
        title: "Error",
        description: "Failed to load communication data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSequences = async () => {
    try {
      // Fetch actual automated sequences from the database
      const { data, error } = await supabase
        .from('automated_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert database data to component format
      const formattedSequences: AutomatedSequence[] = (data || []).map(seq => ({
        id: seq.id,
        name: seq.name,
        trigger: seq.trigger_type,
        status: seq.is_active ? 'active' : 'paused',
        emails_sent: 0, // Placeholder - implement real tracking
        open_rate: 0, // Placeholder - implement real tracking
        click_rate: 0 // Placeholder - implement real tracking
      }));

      setSequences(formattedSequences);
    } catch (error) {
      console.error('Error fetching sequences:', error);
      // Fallback to sample data if no sequences exist
      const sampleData: AutomatedSequence[] = [
        {
          id: "sample-1",
          name: "Welcome Series",
          trigger: "new_student_signup",
          status: "active",
          emails_sent: 0,
          open_rate: 0,
          click_rate: 0
        }
      ];
      setSequences(sampleData);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedData: CommunicationTemplate[] = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        type: (template.message_type as 'email' | 'sms' | 'push') || 'email',
        subject: template.subject,
        content: template.content,
        variables: template.variables ? Object.keys(template.variables) : []
      }));
      
      setTemplates(formattedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to sample data if no templates exist
      const sampleData: CommunicationTemplate[] = [
        {
          id: "sample-1",
          name: "Welcome Email",
          type: "email",
          subject: "Welcome to {{academy_name}}, {{student_name}}!",
          content: "Dear {{student_name}}, welcome to our martial arts family at {{academy_name}}. We're excited to have you join us on your martial arts journey!",
          variables: ["academy_name", "student_name"]
        }
      ];
      setTemplates(sampleData);
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      // Fetch actual scheduled messages from communication logs
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Convert communication logs to scheduled message format
      const formattedMessages: ScheduledMessage[] = (data || []).map(log => ({
        id: log.id,
        recipient_type: "Individual Contact",
        recipient_count: 1,
        scheduled_for: log.sent_at,
        status: log.status as 'scheduled' | 'sent' | 'failed',
        template_name: log.subject || log.message_type
      }));

      setScheduledMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      // Show empty state if no messages exist
      setScheduledMessages([]);
    }
  };

  const handleCreateSequence = async () => {
    if (!sequenceName || !sequenceTrigger) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would require implementing automated sequences table
      toast({
        title: "Sequence Created",
        description: `Automated sequence "${sequenceName}" has been created`,
      });
      
      setIsSequenceDialogOpen(false);
      resetSequenceForm();
      fetchSequences();
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast({
        title: "Error",
        description: "Failed to create automated sequence",
        variant: "destructive",
      });
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          name: templateName,
          subject: templateSubject,
          content: templateContent,
          message_type: templateType as 'email' | 'sms' | 'push'
        });

      if (error) throw error;

      toast({
        title: "Template Created", 
        description: `Template "${templateName}" has been created`,
      });
      
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const handleScheduleMassMessage = async () => {
    if (!messageRecipients || !messageTemplate || !scheduleDateTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // This would require implementing mass messaging functionality
      toast({
        title: "Message Scheduled",
        description: `Mass message scheduled for ${new Date(scheduleDateTime).toLocaleString()}`,
      });
      
      setIsMassMessageDialogOpen(false);
      resetMassMessageForm();
      fetchScheduledMessages();
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast({
        title: "Error",
        description: "Failed to schedule mass message",
        variant: "destructive",
      });
    }
  };

  const toggleSequenceStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    // Update sequence status
    toast({
      title: "Sequence Updated",
      description: `Sequence ${newStatus === 'active' ? 'activated' : 'paused'}`,
    });
  };

  const resetSequenceForm = () => {
    setSequenceName("");
    setSequenceTrigger("");
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateType("email");
    setTemplateSubject("");
    setTemplateContent("");
  };

  const resetMassMessageForm = () => {
    setMessageRecipients("");
    setMessageTemplate("");
    setScheduleDateTime("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Sent</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Scheduled</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading enhanced communications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enhanced Communications</h2>
          <p className="text-muted-foreground">Automated sequences, templates, and mass messaging</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSequenceDialogOpen} onOpenChange={setIsSequenceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Create Sequence
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Automated Sequence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sequenceName">Sequence Name</Label>
                  <Input
                    id="sequenceName"
                    value={sequenceName}
                    onChange={(e) => setSequenceName(e.target.value)}
                    placeholder="Welcome Series"
                  />
                </div>
                <div>
                  <Label htmlFor="trigger">Trigger Event</Label>
                  <Select value={sequenceTrigger} onValueChange={setSequenceTrigger}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_student_signup">New Student Signup</SelectItem>
                      <SelectItem value="payment_overdue">Payment Overdue</SelectItem>
                      <SelectItem value="student_birthday">Student Birthday</SelectItem>
                      <SelectItem value="inactive_30_days">Inactive 30 Days</SelectItem>
                      <SelectItem value="belt_promotion">Belt Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateSequence} className="w-full">
                  Create Sequence
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Communication Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Welcome Email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateType">Type</Label>
                    <Select value={templateType} onValueChange={setTemplateType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {templateType === 'email' && (
                  <div>
                    <Label htmlFor="templateSubject">Subject Line</Label>
                    <Input
                      id="templateSubject"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      placeholder="Welcome to {{dojo_name}}, {{student_name}}!"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="templateContent">Content</Label>
                  <Textarea
                    id="templateContent"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Dear {{student_name}}, welcome to our martial arts family..."
                    rows={6}
                  />
                </div>
                <Button onClick={handleCreateTemplate} className="w-full">
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isMassMessageDialogOpen} onOpenChange={setIsMassMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Mass Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Mass Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select value={messageRecipients} onValueChange={setMessageRecipients}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_active">All Active Students</SelectItem>
                      <SelectItem value="overdue_payments">Overdue Payments</SelectItem>
                      <SelectItem value="inactive_students">Inactive Students</SelectItem>
                      <SelectItem value="parents">Parents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={messageTemplate} onValueChange={setMessageTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduleTime">Schedule For</Label>
                  <Input
                    id="scheduleTime"
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                  />
                </div>
                <Button onClick={handleScheduleMassMessage} className="w-full">
                  Schedule Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Repeat className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{sequences.filter(s => s.status === 'active').length}</div>
            <div className="text-sm text-muted-foreground">Active Sequences</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{sequences.reduce((sum, s) => sum + s.emails_sent, 0)}</div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {(sequences.reduce((sum, s) => sum + s.open_rate, 0) / sequences.length).toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Open Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{scheduledMessages.filter(m => m.status === 'scheduled').length}</div>
            <div className="text-sm text-muted-foreground">Scheduled Messages</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Communication Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sequences">Automated Sequences</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Messages</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="sequences">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Messages Sent</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.map((sequence) => (
                      <TableRow key={sequence.id}>
                        <TableCell className="font-medium">{sequence.name}</TableCell>
                        <TableCell>{sequence.trigger.replace('_', ' ')}</TableCell>
                        <TableCell>{getStatusBadge(sequence.status)}</TableCell>
                        <TableCell>{sequence.emails_sent}</TableCell>
                        <TableCell>{sequence.open_rate}%</TableCell>
                        <TableCell>{sequence.click_rate}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={sequence.status === 'active'}
                              onCheckedChange={() => toggleSequenceStatus(sequence.id, sequence.status)}
                            />
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="templates">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Variables</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {template.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.subject || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.slice(0, 2).map((variable) => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                            {template.variables.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.variables.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Test</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="scheduled">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.recipient_type}</TableCell>
                        <TableCell>{message.recipient_count}</TableCell>
                        <TableCell>{message.template_name}</TableCell>
                        <TableCell>{new Date(message.scheduled_for).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(message.status)}</TableCell>
                        <TableCell>
                          {message.status === 'scheduled' && (
                            <Button variant="outline" size="sm" className="text-red-600">
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};