export interface Message {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_message_id?: string;
  file_url?: string;
}

export interface MessageState {
  messages: Record<string, Message>;
  channelMessages: Record<string, string[]>;
  threadMessages: Record<string, string[]>;
  loading: boolean;
  error: string | null;
}

export interface MessageActions {
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export type MessageStore = MessageState & MessageActions; 