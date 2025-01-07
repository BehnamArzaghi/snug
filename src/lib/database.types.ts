export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string
          created_at: string
          name: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          content: string
          user_id: string
          channel_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          user_id: string
          channel_id: string
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          user_id?: string
          channel_id?: string
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
        }
        Insert: {
          id: string
          created_at?: string
          name: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_messages: {
        Args: {
          search_query: string
          channel_id: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          content: string
          created_at: string
          user_id: string
          channel_id: string
          context_before: Json
          context_after: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
} 