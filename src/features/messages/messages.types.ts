export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  file_url?: string;
  attachment_path?: string;
  created_at: string;
  edited_at?: string;
  edited_by?: string;
  parent_message_id?: string;
}

export interface MessageState {
  messages: Record<string, Message>;
  isLoading: boolean;
  error: string | null;
} 