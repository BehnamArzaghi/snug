import type { Database } from '@/lib/database.types';

export type Message = {
  id: string;
  content: string;
  channel_id: string;
  user_id: string;
  file_url: string | null;
  created_at: string;
  attachment_path: string | null;
  edited_at: string | null;
  edited_by: string | null;
  parent_message_id: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    last_seen: string | null;
  };
};

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