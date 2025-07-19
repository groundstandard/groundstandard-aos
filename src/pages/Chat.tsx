import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, MessageSquare, Send, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/BackButton";

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'announcements' | 'class' | 'belt_level';
  created_by: string;
  member_count: number;
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  channel_id: string;
}

const Chat = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ['chat-channels'],
    queryFn: async (): Promise<Channel[]> => {
      // Mock data for demonstration - would connect to real chat system
      const mockChannels: Channel[] = [
        {
          id: 'general',
          name: 'General',
          description: 'General academy discussion',
          type: 'general',
          created_by: 'admin',
          member_count: 45,
          last_message: {
            content: 'Welcome everyone to the academy chat!',
            sender_name: 'Sensei Johnson',
            created_at: new Date(Date.now() - 60000).toISOString()
          }
        },
        {
          id: 'announcements',
          name: 'Announcements',
          description: 'Important academy announcements',
          type: 'announcements',
          created_by: 'admin',
          member_count: 45,
          last_message: {
            content: 'Belt testing ceremony scheduled for August 1st',
            sender_name: 'Admin',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        },
        {
          id: 'beginners',
          name: 'Beginners Class',
          description: 'Discussion for beginner students',
          type: 'class',
          created_by: 'instructor',
          member_count: 15,
          last_message: {
            content: 'Great job in today\'s class everyone!',
            sender_name: 'Instructor Sarah',
            created_at: new Date(Date.now() - 7200000).toISOString()
          }
        },
        {
          id: 'advanced',
          name: 'Advanced Training',
          description: 'Advanced techniques and sparring discussion',
          type: 'class',
          created_by: 'instructor',
          member_count: 8,
          last_message: {
            content: 'Don\'t forget to practice the new kata',
            sender_name: 'Master Chen',
            created_at: new Date(Date.now() - 10800000).toISOString()
          }
        }
      ];
      
      return mockChannels;
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', selectedChannel],
    queryFn: async (): Promise<Message[]> => {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Welcome everyone to the academy chat system!',
          sender_id: 'admin',
          sender_name: 'Sensei Johnson',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          channel_id: selectedChannel
        },
        {
          id: '2',
          content: 'Looking forward to training with everyone!',
          sender_id: 'student1',
          sender_name: 'Alex Smith',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          channel_id: selectedChannel
        },
        {
          id: '3',
          content: 'Does anyone have tips for improving kicks?',
          sender_id: 'student2',
          sender_name: 'Maria Garcia',
          created_at: new Date(Date.now() - 900000).toISOString(),
          channel_id: selectedChannel
        },
        {
          id: '4',
          content: 'Practice your balance first, then work on height and speed.',
          sender_id: 'instructor',
          sender_name: 'Instructor Sarah',
          created_at: new Date(Date.now() - 300000).toISOString(),
          channel_id: selectedChannel
        }
      ];
      
      return mockMessages;
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; channel_id: string }) => {
      // Simulate sending message - would integrate with real chat system
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: `msg-${Date.now()}`,
        content: messageData.content,
        sender_id: profile?.id || 'current-user',
        sender_name: `${profile?.first_name} ${profile?.last_name}`,
        created_at: new Date().toISOString(),
        channel_id: messageData.channel_id
      };
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChannel] });
      toast({ title: "Message sent!" });
    },
    onError: () => {
      toast({ title: "Error sending message", variant: "destructive" });
    }
  });

  const createChannelMutation = useMutation({
    mutationFn: async (channelData: { name: string; description: string; type: string }) => {
      // Simulate creating channel
      await new Promise(resolve => setTimeout(resolve, 500));
      return channelData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      setIsCreateChannelOpen(false);
      toast({ title: "Channel created successfully!" });
    },
    onError: () => {
      toast({ title: "Error creating channel", variant: "destructive" });
    }
  });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessageMutation.mutate({
        content: newMessage.trim(),
        channel_id: selectedChannel
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Academy Chat
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect with instructors and fellow students
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Channels Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Channels</CardTitle>
                {profile?.role === 'admin' && (
                  <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Channel</DialogTitle>
                        <DialogDescription>
                          Create a new discussion channel for students
                        </DialogDescription>
                      </DialogHeader>
                      <CreateChannelForm 
                        onSubmit={(data) => createChannelMutation.mutate(data)}
                        isLoading={createChannelMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {channels?.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedChannel === channel.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedChannel(channel.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">#{channel.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {channel.member_count}
                      </Badge>
                    </div>
                    {channel.last_message && (
                      <p className="text-xs text-muted-foreground truncate">
                        {channel.last_message.sender_name}: {channel.last_message.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    #{channels?.find(c => c.id === selectedChannel)?.name}
                  </CardTitle>
                  <CardDescription>
                    {channels?.find(c => c.id === selectedChannel)?.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {channels?.find(c => c.id === selectedChannel)?.member_count} members
                </div>
              </div>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">Loading messages...</div>
              ) : (
                messages?.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {message.sender_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.created_at)} at {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message #${channels?.find(c => c.id === selectedChannel)?.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface CreateChannelFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const CreateChannelForm = ({ onSubmit, isLoading }: CreateChannelFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Channel Name</Label>
        <Input
          placeholder="Enter channel name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="type">Channel Type</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select channel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General Discussion</SelectItem>
            <SelectItem value="announcements">Announcements</SelectItem>
            <SelectItem value="class">Class Specific</SelectItem>
            <SelectItem value="belt_level">Belt Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          placeholder="Brief description of the channel purpose"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Channel"}
      </Button>
    </form>
  );
};

export default Chat;