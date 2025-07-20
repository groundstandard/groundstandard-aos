import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { EnhancedChatInterface } from "@/components/chat/EnhancedChatInterface";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Navigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Chat = () => {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="h-screen bg-gradient-subtle flex flex-col overflow-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 flex-shrink-0 max-w-none">
        <div className="flex items-start gap-2 sm:gap-4 mb-4 sm:mb-6">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Academy Chat</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Connect with instructors and fellow students in real-time
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <EnhancedChatInterface />
      </div>
      
      {/* View Toggle at bottom center */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <ViewToggle />
      </div>
    </div>
  );
};

export default Chat;