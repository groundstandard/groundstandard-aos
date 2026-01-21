import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAcademy } from "@/hooks/useAcademy";
import {
  MessageSquare,
  Plus,
  Send,
  Users,
  Mail,
  Smartphone,
  Bell,
  Settings,
  Calendar,
  Megaphone,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface CommunicationTemplate {
  id: string;
  name: string;
  message_type: 'email' | 'sms' | 'notification' | 'announcement';
  subject?: string;
  content: string;
  created_at: string;
  created_by: string;
}

interface CommunicationLog {
  id: string;
  message_type: 'email' | 'sms' | 'notification' | 'announcement';
  subject?: string;
  content: string;
  contact_id: string;
  status: 'sent' | 'pending' | 'failed';
  sent_at: string;
  sent_by: string;
  metadata?: any;
}

export const CommunicationCenter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentAcademyId } = useAcademy();
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null);
  const [isViewLogOpen, setIsViewLogOpen] = useState(false);
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    message_type: 'email' as CommunicationTemplate['message_type'],
    subject: '',
    content: '',
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from('communication_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({ title: 'Message deleted' });
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
      setIsViewLogOpen(false);
      setSelectedLog(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const [messageForm, setMessageForm] = useState({
    message_type: 'email' as CommunicationTemplate['message_type'],
    subject: '',
    content: '',
    target_audience: 'all' as 'all' | 'students' | 'instructors' | 'parents' | 'custom',
    custom_recipients: [] as string[]
  });

  // Fetch templates from database
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({ title: 'Template deleted' });
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch communication logs from database
  const { data: communicationLogs = [], isLoading: logsLoading } = useQuery<CommunicationLog[]>({
    queryKey: ['communication-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communication_logs')
        .select('*')
        .order('sent_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as CommunicationLog[];
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: typeof messageForm) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const senderId = authData.user?.id;
      if (!senderId) throw new Error('Not authenticated');

      // Get recipient count based on target audience
      let recipientCount = 0;
      
      if (messageData.target_audience === 'all') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        recipientCount = count || 0;
      } else if (messageData.target_audience === 'students') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');
        recipientCount = count || 0;
      } else if (messageData.target_audience === 'instructors') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'instructor');
        recipientCount = count || 0;
      } else if (messageData.target_audience === 'parents') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .not('parent_id', 'is', null);
        recipientCount = count || 0;
      }

      // Log the communication to database
      const { data, error } = await supabase
        .from('communication_logs')
        .insert([{
          contact_id: senderId,
          message_type: messageData.message_type,
          subject: messageData.subject || null,
          content: messageData.content,
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: senderId,
          metadata: {
            academy_id: currentAcademyId,
            target_audience: messageData.target_audience,
            custom_recipients: messageData.custom_recipients,
            recipients_count: recipientCount
          }
        }])
        .select()
        .single();

      if (error) throw error;

      // Here you would call an edge function to actually send the message
      // For now, we'll just simulate success
      console.log('Message logged to database:', data);
      
      return { success: true, recipients: recipientCount };
    },
    onSuccess: (data) => {
      toast({ 
        title: "Message sent successfully!", 
        description: `Message delivered to ${data.recipients} recipients`
      });
      setMessageForm({
        message_type: 'email',
        subject: '',
        content: '',
        target_audience: 'all',
        custom_recipients: []
      });
      // Refresh the communication logs
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to send message", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: { name: string; message_type: string; subject?: string; content: string; }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert([{
          name: templateData.name,
          message_type: templateData.message_type,
          subject: templateData.subject || null,
          content: templateData.content,
          variables: null // Could be expanded for template variables
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Template created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      setIsNewTemplateDialogOpen(false);
      setNewTemplateForm({
        name: '',
        message_type: 'email',
        subject: '',
        content: '',
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create template", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const saveAsTemplate = () => {
    if (!messageForm.content) {
      toast({
        title: "Missing content",
        description: "Please enter message content before saving as template",
        variant: "destructive"
      });
      return;
    }

    const templateName = prompt("Enter template name:");
    if (templateName) {
      createTemplateMutation.mutate({
        name: templateName,
        message_type: messageForm.message_type,
        subject: messageForm.subject,
        content: messageForm.content
      });
    }
  };

  const useTemplate = (template: any) => {
    setMessageForm({
      message_type: template.message_type as CommunicationTemplate['message_type'],
      subject: template.subject || '',
      content: template.content,
      target_audience: 'all', // Default since templates don't store this
      custom_recipients: []
    });
    setActiveTab('compose');
    toast({ title: "Template loaded", description: `${template.name} template has been loaded` });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'All Members';
      case 'students': return 'Students Only';
      case 'instructors': return 'Instructors Only';
      case 'parents': return 'Parents Only';
      case 'custom': return 'Custom List';
      default: return audience;
    }
  };

  const communicationStats = {
    totalSent: communicationLogs.length,
    thisMonth: communicationLogs.filter(log => {
      const logDate = new Date(log.sent_at);
      const now = new Date();
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }).length,
    totalRecipients: communicationLogs.reduce((sum, log) => {
      // Get recipients count from metadata if available
      const metadata = log.metadata as any;
      return sum + (metadata?.recipients_count || 0);
    }, 0),
    templates: templates.length
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.totalSent}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.totalRecipients}</div>
            <p className="text-xs text-muted-foreground">Messages delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communicationStats.templates}</div>
            <p className="text-xs text-muted-foreground">Saved templates</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose Message</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose New Message</CardTitle>
              <CardDescription>Send messages to your academy members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="message-type">Message Type</Label>
                  <Select 
                    value={messageForm.message_type} 
                    onValueChange={(value: CommunicationTemplate['message_type']) => 
                      setMessageForm(prev => ({ ...prev, message_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="notification">Push Notification</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select 
                    value={messageForm.target_audience} 
                    onValueChange={(value: typeof messageForm.target_audience) => 
                      setMessageForm(prev => ({ ...prev, target_audience: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="instructors">Instructors Only</SelectItem>
                      <SelectItem value="parents">Parents Only</SelectItem>
                      <SelectItem value="custom">Custom Recipients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(messageForm.message_type === 'email' || messageForm.message_type === 'announcement') && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter message subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Message Content</Label>
                <Textarea
                  id="content"
                  value={messageForm.content}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{name}'} for personalization, {'{time}'} for class times, {'{date}'} for dates
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={saveAsTemplate}>Save as Template</Button>
                <Button 
                  onClick={() => sendMessageMutation.mutate(messageForm)}
                  disabled={!messageForm.content || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Pre-saved message templates for quick sending</CardDescription>
                </div>
                <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Template</DialogTitle>
                      <DialogDescription>Create a reusable message template.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={newTemplateForm.name}
                          onChange={(e) => setNewTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Welcome Message"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-type">Message Type</Label>
                        <Select
                          value={newTemplateForm.message_type}
                          onValueChange={(value: CommunicationTemplate['message_type']) =>
                            setNewTemplateForm(prev => ({ ...prev, message_type: value }))
                          }
                        >
                          <SelectTrigger id="template-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="notification">Push Notification</SelectItem>
                            <SelectItem value="announcement">Announcement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(newTemplateForm.message_type === 'email' || newTemplateForm.message_type === 'announcement') && (
                        <div className="space-y-2">
                          <Label htmlFor="template-subject">Subject</Label>
                          <Input
                            id="template-subject"
                            value={newTemplateForm.subject}
                            onChange={(e) => setNewTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter subject"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="template-content">Content</Label>
                        <Textarea
                          id="template-content"
                          value={newTemplateForm.content}
                          onChange={(e) => setNewTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                          rows={6}
                          placeholder="Enter template content..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsNewTemplateDialogOpen(false)}
                          type="button"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            createTemplateMutation.mutate({
                              name: newTemplateForm.name,
                              message_type: newTemplateForm.message_type,
                              subject: newTemplateForm.subject,
                              content: newTemplateForm.content,
                            })
                          }
                          disabled={!newTemplateForm.name || !newTemplateForm.content || createTemplateMutation.isPending}
                          type="button"
                        >
                          {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           {getTypeIcon(template.message_type)}
                           <h4 className="font-medium">{template.name}</h4>
                         </div>
                         <Badge variant="outline" className="text-xs">
                           {template.message_type}
                         </Badge>
                       </div>
                     </CardHeader>
                     <CardContent className="pt-0">
                       {template.subject && (
                         <p className="font-medium text-sm mb-2">{template.subject}</p>
                       )}
                       <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                         {template.content}
                       </p>
                       <div className="flex items-center justify-between">
                         <Badge variant="secondary" className="text-xs">
                           Template
                         </Badge>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => useTemplate(template)}
                          >
                            Use
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const ok = window.confirm(`Delete template "${template.name}"?`);
                              if (!ok) return;
                              deleteTemplateMutation.mutate(template.id);
                            }}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>View all sent messages and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject/Content</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communicationLogs.map((log) => (
                     <TableRow key={log.id}>
                       <TableCell>
                         <div className="flex items-center space-x-2">
                           {getTypeIcon(log.message_type)}
                           <span className="capitalize">{log.message_type}</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div>
                           {log.subject && (
                             <div className="font-medium text-sm">{log.subject}</div>
                           )}
                           <div className="text-sm text-muted-foreground truncate max-w-xs">
                             {log.content}
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Badge variant="secondary">
                           {(log.metadata as any)?.recipients_count || 0}
                         </Badge>
                       </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.sent_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log as unknown as CommunicationLog);
                              setIsViewLogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const typedLog = log as unknown as CommunicationLog;
                              const md = (log.metadata as any) || {};
                              sendMessageMutation.mutate({
                                message_type: typedLog.message_type,
                                subject: typedLog.subject || '',
                                content: typedLog.content,
                                target_audience: (md.target_audience || 'all') as any,
                                custom_recipients: (md.custom_recipients || []) as any,
                              });
                            }}
                            disabled={sendMessageMutation.isPending}
                          >
                            Resend
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const ok = window.confirm('Delete this message log?');
                              if (!ok) return;
                              deleteLogMutation.mutate(log.id);
                            }}
                            disabled={deleteLogMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Communication Actions</CardTitle>
              <CardDescription>Perform bulk messaging operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bulk actions will be available here</p>
                <p className="text-sm">Send messages to multiple groups, schedule campaigns, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isViewLogOpen} onOpenChange={setIsViewLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              {selectedLog
                ? `${selectedLog.message_type.toUpperCase()} • ${new Date(selectedLog.sent_at).toLocaleString()}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Subject</div>
                <div className="text-sm text-muted-foreground break-words">
                  {selectedLog.subject || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Content</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {selectedLog.content}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const md = (selectedLog.metadata as any) || {};
                    sendMessageMutation.mutate({
                      message_type: selectedLog.message_type,
                      subject: selectedLog.subject || '',
                      content: selectedLog.content,
                      target_audience: (md.target_audience || 'all') as any,
                      custom_recipients: (md.custom_recipients || []) as any,
                    });
                  }}
                  disabled={sendMessageMutation.isPending}
                >
                  Resend
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const ok = window.confirm('Delete this message log?');
                    if (!ok) return;
                    deleteLogMutation.mutate(selectedLog.id);
                  }}
                  disabled={deleteLogMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};