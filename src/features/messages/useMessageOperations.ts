import { useContext } from 'react';
import { MessageContext } from './MessageProvider';
import type { Message } from './messages.types';

export function useMessageOperations() {
  const store = useContext(MessageContext);
  if (!store) {
    throw new Error('useMessageOperations must be used within MessageProvider');
  }

  // Get operations
  const setMessages = store((s) => s.setMessages);
  const addMessage = store((s) => s.addMessage);
  const updateMessage = store((s) => s.updateMessage);
  const deleteMessage = store((s) => s.deleteMessage);
  const setLoading = store((s) => s.setLoading);
  const setError = store((s) => s.setError);

  // Wrap operations with loading and error handling
  async function sendMessage(channelId: string, content: string) {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement with messageService
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        channel_id: channelId,
        user_id: 'current-user', // TODO: Get from auth
        content,
        created_at: new Date().toISOString(),
      };
      addMessage(newMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    sendMessage,
    setLoading,
    setError,
  } as const;
}
