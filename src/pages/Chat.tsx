import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { SimpleChatInterface } from "@/components/chat/SimpleChatInterface";
import { Navigate } from "react-router-dom";

const Chat = () => {
  const { user, loading } = useAuth();

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
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <div className="container mx-auto p-4 lg:p-6 flex-1 flex flex-col max-w-none">
        <div className="mb-4 lg:mb-6">
          <BackButton />
        </div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Academy Chat</h1>
        </div>
        
        <div className="flex-1 min-h-0">
          <SimpleChatInterface />
        </div>
      </div>
    </div>
  );
};

export default Chat;