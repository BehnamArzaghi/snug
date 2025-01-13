export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionState {
  reactions: Reaction[];
  isLoading: boolean;
  error: string | null;
}

export interface ReactionStore extends ReactionState {
  // State setters
  setReactions: (reactions: Reaction[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Operations
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (reactionId: string) => Promise<void>;
}
