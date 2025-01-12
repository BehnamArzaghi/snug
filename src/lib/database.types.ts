export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          last_seen: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          last_seen?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          last_seen?: string | null;
        };
      };
      channels: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_private: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_private?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_private?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      channel_members: {
        Row: {
          channel_id: string;
          user_id: string;
          role: 'admin' | 'member';
          created_at: string;
          last_read: string | null;
        };
        Insert: {
          channel_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          created_at?: string;
          last_read?: string | null;
        };
        Update: {
          channel_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          created_at?: string;
          last_read?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          parent_message_id: string | null;
          attachment_path: string | null;
          created_at: string;
          edited_at: string | null;
          edited_by: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          content: string;
          parent_message_id?: string | null;
          attachment_path?: string | null;
          created_at?: string;
          edited_at?: string | null;
          edited_by?: string | null;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
          parent_message_id?: string | null;
          attachment_path?: string | null;
          created_at?: string;
          edited_at?: string | null;
          edited_by?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string | null;
          data: Record<string, any> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content?: string | null;
          data?: Record<string, any> | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string | null;
          data?: Record<string, any> | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      access_requests: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          status: 'pending' | 'approved' | 'denied' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          status?: 'pending' | 'approved' | 'denied' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          status?: 'pending' | 'approved' | 'denied' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          channel_id: string;
          actor_id: string;
          action: string;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          actor_id: string;
          action: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          actor_id?: string;
          action?: string;
          details?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 