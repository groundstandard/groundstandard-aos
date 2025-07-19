import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, FileText, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddPeopleToChannelModal } from './AddPeopleToChannelModal';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'premium';
  is_admin_only: boolean;
  created_by: string;
  member_count: number;
}

interface ChannelSetupProps {
  channel: Channel | undefined;
  onDescriptionAdded: (description: string) => void;
  isDM?: boolean;
}

export const ChannelSetup = ({ channel, onDescriptionAdded, isDM = false }: ChannelSetupProps) => {
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [showAddPeopleDialog, setShowAddPeopleDialog] = useState(false);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleAddDescription = () => {
    if (description.trim()) {
      onDescriptionAdded(description);
      setShowDescriptionDialog(false);
      setDescription('');
      toast({
        title: "Description added",
        description: "Channel description has been updated."
      });
    }
  };

  const handleAddPeople = (userIds: string[]) => {
    // In a real app, this would add users to the channel
    toast({
      title: "People added",
      description: `${userIds.length} user${userIds.length !== 1 ? 's' : ''} added to the channel.`
    });
  };

  const getChannelIcon = () => {
    if (!channel) return <span className="text-lg">#</span>;
    if (channel.type === 'premium') return <Lock className="h-5 w-5 text-amber-500" />;
    if (channel.type === 'private' || channel.is_admin_only) return <Lock className="h-5 w-5 text-muted-foreground" />;
    return <span className="text-lg">#</span>;
  };

  // For DMs, we don't show the setup UI at all
  if (isDM) {
    return null;
  }

  return (
    <div className="p-6 border-b bg-muted/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center">
          {getChannelIcon()}
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {channel?.name || 'Loading...'}
          </h2>
          <p className="text-sm text-muted-foreground">
            You created this channel on {formatDate(new Date().toISOString())}. This is the very beginning of the <Lock className="h-4 w-4 inline" /> {channel?.name || 'channel'} channel.
          </p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={() => setShowDescriptionDialog(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Add Description
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowAddPeopleDialog(true)}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Add People to Channel
        </Button>
      </div>

      {/* Add Description Dialog */}
      <Dialog open={showDescriptionDialog} onOpenChange={setShowDescriptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Channel Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this channel about?"
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDescriptionDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddDescription}>
                Add Description
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add People to Channel Modal */}
      <AddPeopleToChannelModal
        open={showAddPeopleDialog}
        onOpenChange={setShowAddPeopleDialog}
        onAddPeople={handleAddPeople}
        channelName={channel?.name}
      />
    </div>
  );
};