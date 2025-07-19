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
  onSendMessage: (attachments?: Array<{url: string; type: string; name: string}>) => void;
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
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
      
      // Filter out failed uploads and create attachment objects
      const successfulAttachments = uploadedUrls
        .map((url, index) => url ? {
          url,
          type: attachments[index].type,
          name: attachments[index].name
        } : null)
        .filter(Boolean);
      
      // Clear attachments
      setAttachments([]);
      
      // Send message with attachments
      onSendMessage(successfulAttachments);
    } else {
      onSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setAttachments(prev => [...prev, audioFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Don't show toast when recording stops to avoid blocking UI
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer for 5-minute maximum
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 minutes = 300 seconds
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Don't show toast when recording starts to avoid UI clutter
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
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
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
                    >
                      ×
                    </Button>
                  </div>
                ) : file.type.startsWith('video/') ? (
                  <div className="relative">
                    <video 
                      src={URL.createObjectURL(file)}
                      className="w-20 h-20 object-cover rounded-lg border"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
                    >
                      ×
                    </Button>
                  </div>
                ) : file.type.startsWith('audio/') ? (
                  <div className="relative flex items-center gap-3 bg-background rounded-2xl px-4 py-3 border min-w-48 max-w-64">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary-foreground" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {/* Waveform visualization */}
                        {[1, 0.3, 0.8, 0.6, 1, 0.4, 0.9, 0.7, 0.5, 0.8, 0.3, 0.6].map((height, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-muted-foreground rounded-full transition-all duration-200" 
                            style={{ height: `${height * 16}px` }}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">0:02</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs truncate max-w-20">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md"
                    >
                      ×
                    </Button>
                  </div>
                )}
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => galleryInputRef.current?.click()}
            className="h-9 w-9 p-0"
            title="Select from gallery"
          >
            <Image className="h-4 w-4" />
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
          
          {/* Recording Status */}
          {isRecording && (
            <div className="absolute inset-x-0 -top-8 flex items-center justify-center">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / 5:00
              </div>
            </div>
          )}
          
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
      
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files, 'image')}
      />
    </div>
  );
};