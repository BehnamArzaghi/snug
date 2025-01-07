import { ReactNode, useState, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/hooks/useAuth';
import { MessageList } from '@/components/messages/MessageList';

interface MainPanelProps {
  children?: ReactNode;
  isLoading?: boolean;
  channelId?: string;
}

export function MainPanel({ children, isLoading, channelId }: MainPanelProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Debug auth state
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth state:', { 
        isAuthenticated: !!user,
        userId: user?.id,
        hasSession: !!session,
        sessionUserId: session?.user?.id
      });
    };
    checkSession();
  }, [user]);

  const sendMessage = async () => {
    console.log('Send attempt:', { 
      message, 
      userId: user?.id,
      channelId,
      isAuthenticated: !!user
    });
    if (!message.trim() || !user || !channelId) {
      console.log('Send blocked:', { 
        hasMessage: !!message.trim(), 
        hasUser: !!user, 
        hasChannelId: !!channelId,
        userId: user?.id 
      });
      return;
    }

    setIsSending(true);
    try {
      console.log('Sending to Supabase:', {
        content: message.trim(),
        channel_id: channelId,
        user_id: user.id
      });
      
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content: message.trim(),
            channel_id: channelId,
            user_id: user.id
          }
        ]);

      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        throw error;
      }
      console.log('Message sent successfully');
      setMessage('');
    } catch (e) {
      console.error('Error sending message:', {
        error: e,
        errorMessage: e instanceof Error ? e.message : 'Unknown error',
        errorStack: e instanceof Error ? e.stack : undefined
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : channelId ? (
          <MessageList channelId={channelId} />
        ) : children}
      </div>

      {/* Message Input */}
      {channelId && (
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => {
                // TODO: Implement file upload
              }}
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              size="icon"
              className="shrink-0"
              onClick={sendMessage}
              disabled={isSending || !message.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      )}
    </div>
  );
} 