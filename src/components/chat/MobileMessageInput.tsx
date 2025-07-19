import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Send, 
  Plus,
  Smile, 
  AtSign,
  Camera,
  Video,
  Mic,
  FileText,
  Image,
  Folder,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MentionSearch } from './MentionSearch';
import { useAuth } from '@/hooks/useAuth';

interface MobileMessageInputProps {
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onSendMessage: (attachments?: Array<{url: string; type: string; name: string}>, mentionedUsers?: string[]) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  channelName?: string;
  disabled?: boolean;
}

export const MobileMessageInput = ({
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onKeyPress,
  channelName = "chat",
  disabled = false
}: MobileMessageInputProps) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

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
    setShowAttachmentMenu(false);
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
      onSendMessage(successfulAttachments, mentionedUsers);
    } else {
      onSendMessage(undefined, mentionedUsers);
    }
    
    // Clear mentioned users after sending
    setMentionedUsers([]);
  };

  const handleInputChange = (value: string) => {
    onNewMessageChange(value);
    
    // Check for @ mentions and # channels
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const lastHashSymbol = textBeforeCursor.lastIndexOf('#');
    
    // Determine which symbol is more recent
    const lastSymbol = Math.max(lastAtSymbol, lastHashSymbol);
    
    if (lastSymbol !== -1 && lastSymbol === cursorPosition - 1) {
      // User just typed @ or #, show search
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setMentionPosition({
          top: rect.top - 200,
          left: rect.left
        });
      }
      setMentionSearchQuery('');
      setShowMentionSearch(true);
    } else if (lastSymbol !== -1) {
      // Check if we're still in a mention/channel context
      const textAfterSymbol = textBeforeCursor.slice(lastSymbol + 1);
      const hasSpace = textAfterSymbol.includes(' ');
      
      if (!hasSpace && textAfterSymbol.length > 0) {
        setMentionSearchQuery(textAfterSymbol);
        setShowMentionSearch(true);
      } else if (hasSpace || textAfterSymbol.length === 0) {
        setShowMentionSearch(false);
      }
    } else {
      setShowMentionSearch(false);
    }
  };

  const handleUserSelect = (user: any) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newMessage.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    const lastHashSymbol = textBeforeCursor.lastIndexOf('#');
    const lastSymbol = Math.max(lastAtSymbol, lastHashSymbol);
    
    if (lastSymbol !== -1) {
      const textBeforeSymbol = newMessage.slice(0, lastSymbol);
      const textAfterCursor = newMessage.slice(cursorPosition);
      const newText = `${textBeforeSymbol}${user.profileName} ${textAfterCursor}`;
      
      onNewMessageChange(newText);
      
      // Add user to mentioned users list (only for @ mentions, not # channels)
      if (lastAtSymbol === lastSymbol) {
        if (user.id === 'everyone') {
          setMentionedUsers(prev => [...prev, 'everyone']);
        } else {
          setMentionedUsers(prev => [...prev, user.id]);
        }
      }
    }
    
    setShowMentionSearch(false);
    setMentionSearchQuery('');
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionSearch && (e.key === 'Escape' || e.key === ' ')) {
      setShowMentionSearch(false);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithAttachments();
    }
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💪', '🥋'];

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
      };

      mediaRecorder.start();
      setShowAttachmentMenu(false);
      
      // Auto-stop after 5 minutes
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 300000);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Could not access microphone"
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      {/* Mention Search */}
      {showMentionSearch && (
        <div 
          className="fixed z-50" 
          style={{ 
            top: mentionPosition.top, 
            left: mentionPosition.left,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <MentionSearch
            searchQuery={mentionSearchQuery}
            onSelectUser={handleUserSelect}
            currentUserRole={profile?.role || 'student'}
            position={mentionPosition}
            searchType={(() => {
              const cursorPosition = inputRef.current?.selectionStart || 0;
              const textBeforeCursor = newMessage.slice(0, cursorPosition);
              const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
              const lastHashSymbol = textBeforeCursor.lastIndexOf('#');
              return lastHashSymbol > lastAtSymbol ? 'channel' : 'user';
            })()}
          />
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded-lg border"
                  />
                ) : file.type.startsWith('audio/') ? (
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground"
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
        <div className="p-3 border-b bg-muted/30">
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
                className="h-8 w-8 p-0 text-lg"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input */}
      <div className="flex items-center gap-2 p-4">
        <div className="flex-1 flex items-center bg-muted/50 rounded-full px-4 py-2 gap-2">
          {/* Plus Button */}
          <Sheet open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh]">
              <div className="space-y-4 pb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Photos & Videos
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-primary"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    View Library
                  </Button>
                </h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <Button
                    variant="ghost"
                    className="aspect-square flex flex-col items-center justify-center gap-2 h-auto p-4"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8" />
                    <span className="text-xs">Camera</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="aspect-square flex flex-col items-center justify-center gap-2 h-auto p-4"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <Image className="h-8 w-8" />
                    <span className="text-xs">Photo</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="aspect-square flex flex-col items-center justify-center gap-2 h-auto p-4"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-8 w-8" />
                    <span className="text-xs">Video</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={startRecording}
                  >
                    <Mic className="h-5 w-5" />
                    Record an Audio Clip
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-5 w-5" />
                    Record a Video Clip
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-5 w-5" />
                    Upload a File
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    disabled
                  >
                    <RotateCcw className="h-5 w-5" />
                    Recent Canvases
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-12"
                    disabled
                  >
                    <Folder className="h-5 w-5" />
                    Recent Files
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Input Field */}
          <Input
            ref={inputRef}
            placeholder={`Message ${channelName}...`}
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0"
          />

          {/* Emoji Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Mention Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => {
              onNewMessageChange(newMessage + '@');
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <AtSign className="h-5 w-5" />
          </Button>
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSendWithAttachments}
          size="sm" 
          className={`h-10 w-10 p-0 rounded-full shrink-0 ${
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
        accept="*/*"
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