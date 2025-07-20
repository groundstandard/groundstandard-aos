import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Mail, 
  FileText, 
  Download, 
  Settings,
  MessageSquare,
  CheckCircle
} from "lucide-react";

interface BulkActionsToolbarProps {
  selectedContactIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export const BulkActionsToolbar = ({ 
  selectedContactIds, 
  onClearSelection, 
  onActionComplete 
}: BulkActionsToolbarProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showCommDialog, setShowCommDialog] = useState(false);
  
  const [statusData, setStatusData] = useState({ status: "active" });
  const [noteData, setNoteData] = useState({
    title: "",
    content: "",
    note_type: "general",
    priority: "normal",
    is_private: false
  });
  const [commData, setCommData] = useState({
    type: "email",
    subject: "",
    content: ""
  });

  const performBulkOperation = async (type: string, data: any) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('bulk-contact-operations', {
        body: {
          type,
          contactIds: selectedContactIds,
          data
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Bulk operation completed. ${result.affected_count} contacts updated.`,
      });

      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    await performBulkOperation('update_status', statusData);
    setShowStatusDialog(false);
  };

  const handleAddNote = async () => {
    await performBulkOperation('add_note', noteData);
    setShowNoteDialog(false);
    setNoteData({
      title: "",
      content: "",
      note_type: "general",
      priority: "normal",
      is_private: false
    });
  };

  const handleSendCommunication = async () => {
    await performBulkOperation('send_communication', commData);
    setShowCommDialog(false);
    setCommData({
      type: "email",
      subject: "",
      content: ""
    });
  };

  const handleExportData = async () => {
    await performBulkOperation('export_data', {});
  };

  if (selectedContactIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <Badge variant="secondary">
            {selectedContactIds.length} selected
          </Badge>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          {/* Update Status */}
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Membership Status</DialogTitle>
                <DialogDescription>
                  Update the membership status for {selectedContactIds.length} selected contacts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="bulk-status">New Status</Label>
                  <Select 
                    value={statusData.status} 
                    onValueChange={(value) => setStatusData({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={loading}>
                  {loading ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Note */}
          <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Bulk Note</DialogTitle>
                <DialogDescription>
                  Add the same note to {selectedContactIds.length} selected contacts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="bulk-note-title">Note Title</Label>
                  <Input
                    id="bulk-note-title"
                    value={noteData.title}
                    onChange={(e) => setNoteData({...noteData, title: e.target.value})}
                    placeholder="Enter note title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-note-type">Type</Label>
                    <Select 
                      value={noteData.note_type} 
                      onValueChange={(value) => setNoteData({...noteData, note_type: value})}
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
                    <Label htmlFor="bulk-note-priority">Priority</Label>
                    <Select 
                      value={noteData.priority} 
                      onValueChange={(value) => setNoteData({...noteData, priority: value})}
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
                  <Label htmlFor="bulk-note-content">Content</Label>
                  <Textarea
                    id="bulk-note-content"
                    value={noteData.content}
                    onChange={(e) => setNoteData({...noteData, content: e.target.value})}
                    placeholder="Enter note content..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bulk-note-private"
                    checked={noteData.is_private}
                    onChange={(e) => setNoteData({...noteData, is_private: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="bulk-note-private">Private note</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNote} disabled={loading}>
                  {loading ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Send Communication */}
          <Dialog open={showCommDialog} onOpenChange={setShowCommDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Send Bulk Communication</DialogTitle>
                <DialogDescription>
                  Send a message to {selectedContactIds.length} selected contacts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="comm-type">Communication Type</Label>
                  <Select 
                    value={commData.type} 
                    onValueChange={(value) => setCommData({...commData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="app_notification">App Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comm-subject">Subject</Label>
                  <Input
                    id="comm-subject"
                    value={commData.subject}
                    onChange={(e) => setCommData({...commData, subject: e.target.value})}
                    placeholder="Enter subject"
                  />
                </div>
                <div>
                  <Label htmlFor="comm-content">Message</Label>
                  <Textarea
                    id="comm-content"
                    value={commData.content}
                    onChange={(e) => setCommData({...commData, content: e.target.value})}
                    placeholder="Enter message content..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCommDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendCommunication} disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Data */}
          <Button variant="outline" size="sm" onClick={handleExportData} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          {/* Clear Selection */}
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};