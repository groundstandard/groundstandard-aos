import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Camera, 
  Mic, 
  MicOff,
  Video,
  Image,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MessageInputProps {
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  channelName?: string;
  disabled?: boolean;
}

export const MessageInput = ({
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onKeyPress,
  channelName = "chat",
  disabled = false
}: MessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null, type: 'file' | 'image' | 'video') => {
    if (!files) return;

    const selectedFiles = Array.from(files);
    
    // Validate file types and sizes
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} is larger than 10MB`
        });
        return;
      }
    }

    setAttachments(prev => [...prev, ...selectedFiles]);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    
    let bucket = 'chat-files';
    if (file.type.startsWith('image/')) bucket = 'chat-images';
    else if (file.type.startsWith('video/')) bucket = 'chat-videos';
    else if (file.type.startsWith('audio/')) bucket = 'chat-audio';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSendWithAttachments = async () => {
    if (attachments.length > 0) {
      // Upload attachments first
      const uploadPromises = attachments.map(uploadFile);
      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Filter out failed uploads
      const successfulUploads = uploadedUrls.filter(url => url !== null);
      
      if (successfulUploads.length > 0) {
        // Add attachment info to message content
        const attachmentText = successfulUploads.map(url => `[Attachment: ${url}]`).join('\n');
        const messageWithAttachments = newMessage + (newMessage ? '\n' : '') + attachmentText;
        
        // Update the message content temporarily
        onNewMessageChange(messageWithAttachments);
        
        // Send the message
        onSendMessage();
        
        // Clear attachments
        setAttachments([]);
        return;
      }
    }
    
    onSendMessage();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      // Simple recording implementation
      // In a real app, you'd use MediaRecorder API
      toast({
        title: "Recording started",
        description: "Tap the mic again to stop"
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone"
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording stopped",
      description: "Voice message saved"
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💪', '🥋'];

  return (
    <div className="p-4 border-t bg-background">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 p-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Attachments ({attachments.length})</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background rounded px-2 py-1">
                <FileText className="h-3 w-3" />
                <span className="text-xs truncate max-w-20">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onNewMessageChange(newMessage + emoji);
                  setShowEmojiPicker(false);
                }}
                className="h-8 w-8 p-0 text-lg hover:bg-muted"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Buttons */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 p-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            className="h-9 w-9 p-0"
            title="Take photo"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => videoInputRef.current?.click()}
            className="h-9 w-9 p-0"
            title="Record video"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            placeholder={`Message ${channelName}...`}
            value={newMessage}
            onChange={(e) => onNewMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={disabled}
            className="pr-20 resize-none min-h-[2.5rem] max-h-32 rounded-2xl border-0 bg-muted/50"
            rows={1}
          />
          
          {/* Emoji and Voice Buttons */}
          <div className="absolute right-2 bottom-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-7 w-7 p-0"
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-7 w-7 p-0 ${isRecording ? 'text-red-500' : ''}`}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendWithAttachments}
          size="sm" 
          className={`h-9 w-9 p-0 rounded-full ${
            newMessage.trim() || attachments.length > 0 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-muted-foreground/20'
          }`}
          disabled={(!newMessage.trim() && attachments.length === 0) || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'file')}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'video')}
      />
    </div>
  );
};