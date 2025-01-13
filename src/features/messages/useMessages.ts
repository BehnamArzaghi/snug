import { useContext } from 'react';
import { MessageContext } from './MessageProvider';
import type { Message } from './messages.types';

export function useMessages() {
  const store = useContext(MessageContext);
  if (!store) {
    throw new Error('useMessages must be used within MessageProvider');
  }

  // Get state slices
  const messages = store((s) => s.messages);
  const isLoading = store((s) => s.isLoading);
  const error = store((s) => s.error);

  // Convert messages map to sorted array
  const messageList = Object.values(messages).sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    messages,
    messageList,
    isLoading,
    error,
  } as const;
}
