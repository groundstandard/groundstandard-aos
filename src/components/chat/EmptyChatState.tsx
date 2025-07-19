import { Hash, MessageCircle, Users } from 'lucide-react';

export const EmptyChatState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md mx-auto px-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full flex items-center justify-center mx-auto">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Welcome to Academy Chat
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a channel from the sidebar to start chatting, or create a new channel to get conversations going.
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span>Public Channels</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Direct Messages</span>
          </div>
        </div>
      </div>
    </div>
  );
};