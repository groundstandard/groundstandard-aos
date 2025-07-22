// ABOUTME: Modal component for editing attendance records with status and notes
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface AttendanceEditModalProps {
  attendance: Attendance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttendanceUpdated: () => void;
}

const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  attendance,
  open,
  onOpenChange,
  onAttendanceUpdated,
}) => {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (attendance) {
      setStatus(attendance.status);
      setNotes(attendance.notes || '');
    }
  }, [attendance]);

  const handleSave = async () => {
    if (!attendance) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendance.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });

      onAttendanceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance record",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!attendance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Attendance
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Date and Current Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {new Date(attendance.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">Class Date</p>
              </div>
            </div>
            <Badge variant="outline" className={getStatusColor(attendance.status)}>
              {attendance.status}
            </Badge>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Attendance Status</Label>
            <Select value={status} onValueChange={setStatus}>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this attendance record..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Record Info */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            <div>Created: {new Date(attendance.created_at).toLocaleString()}</div>
            <div>Record ID: {attendance.id.slice(0, 8)}...</div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceEditModal;