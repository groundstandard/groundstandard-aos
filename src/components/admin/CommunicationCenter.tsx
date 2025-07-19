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
  type: 'email' | 'sms' | 'notification' | 'announcement';
  subject?: string;
  content: string;
  target_audience: 'all' | 'students' | 'instructors' | 'parents' | 'custom';
  created_at: string;
  created_by: string;
}

interface CommunicationLog {
  id: string;
  type: 'email' | 'sms' | 'notification' | 'announcement';
  subject?: string;
  content: string;
  recipients_count: number;
  status: 'sent' | 'pending' | 'failed';
  sent_at: string;
  sent_by: string;
}

export const CommunicationCenter = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("compose");
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [messageForm, setMessageForm] = useState({
    type: 'email' as CommunicationTemplate['type'],
    subject: '',
    content: '',
    target_audience: 'all' as CommunicationTemplate['target_audience'],
    custom_recipients: [] as string[]
  });

  // Mock data for templates
  const templates: CommunicationTemplate[] = [
    {
      id: '1',
      name: 'Class Reminder',
      type: 'email',
      subject: 'Upcoming Class Reminder',
      content: 'Don\'t forget about your upcoming class tomorrow at {time}. See you there!',
      target_audience: 'students',
      created_at: '2024-01-15T10:00:00Z',
      created_by: 'admin'
    },
    {
      id: '2',
      name: 'Payment Due',
      type: 'email',
      subject: 'Monthly Payment Reminder',
      content: 'Your monthly membership payment is due in 3 days. Please ensure your payment method is up to date.',
      target_audience: 'all',
      created_at: '2024-01-14T09:00:00Z',
      created_by: 'admin'
    },
    {
      id: '3',
      name: 'Belt Test Notification',
      type: 'notification',
      content: 'Congratulations! You are eligible for your next belt test. Schedule your test today.',
      target_audience: 'students',
      created_at: '2024-01-13T14:00:00Z',
      created_by: 'admin'
    }
  ];

  // Mock data for communication logs
  const communicationLogs: CommunicationLog[] = [
    {
      id: '1',
      type: 'email',
      subject: 'Welcome to Our Academy',
      content: 'Welcome to our martial arts academy! We\'re excited to have you join our community.',
      recipients_count: 15,
      status: 'sent',
      sent_at: '2024-01-15T08:30:00Z',
      sent_by: 'admin'
    },
    {
      id: '2',
      type: 'sms',
      content: 'Class cancelled today due to weather. Make-up class scheduled for tomorrow.',
      recipients_count: 45,
      status: 'sent',
      sent_at: '2024-01-14T07:15:00Z',
      sent_by: 'admin'
    },
    {
      id: '3',
      type: 'notification',
      content: 'New schedule available for next month. Check the app for updates.',
      recipients_count: 120,
      status: 'sent',
      sent_at: '2024-01-13T16:45:00Z',
      sent_by: 'admin'
    }
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: typeof messageForm) => {
      // In a real implementation, this would call an edge function
      console.log('Sending message:', messageData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, recipients: 25 };
    },
    onSuccess: (data) => {
      toast({ 
        title: "Message sent successfully!", 
        description: `Message delivered to ${data.recipients} recipients`
      });
      setMessageForm({
        type: 'email',
        subject: '',
        content: '',
        target_audience: 'all',
        custom_recipients: []
      });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to send message", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const useTemplate = (template: CommunicationTemplate) => {
    setMessageForm({
      type: template.type,
      subject: template.subject || '',
      content: template.content,
      target_audience: template.target_audience,
      custom_recipients: []
    });
    setActiveTab('compose');
    toast({ title: "Template loaded", description: `${template.name} template has been loaded` });
  };

  const getTypeIcon = (type: CommunicationTemplate['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'notification': return <Bell className="h-4 w-4" />;
      case 'announcement': return <Megaphone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: CommunicationLog['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getAudienceLabel = (audience: CommunicationTemplate['target_audience']) => {
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
    totalRecipients: communicationLogs.reduce((sum, log) => sum + log.recipients_count, 0),
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
                    value={messageForm.type} 
                    onValueChange={(value: CommunicationTemplate['type']) => 
                      setMessageForm(prev => ({ ...prev, type: value }))
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
                    onValueChange={(value: CommunicationTemplate['target_audience']) => 
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

              {(messageForm.type === 'email' || messageForm.type === 'announcement') && (
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
                <Button variant="outline">Save as Template</Button>
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(template.type)}
                          <h4 className="font-medium">{template.name}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.type}
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
                          {getAudienceLabel(template.target_audience)}
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
                          {getTypeIcon(log.type)}
                          <span className="capitalize">{log.type}</span>
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
                        <Badge variant="secondary">{log.recipients_count}</Badge>
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
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Resend
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
    </div>
  );
};