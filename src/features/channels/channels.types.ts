export interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface ChannelState {
  channels: Record<string, Channel>;
  activeChannelId: string | null;
  isLoading: boolean;
  error: string | null;
} 