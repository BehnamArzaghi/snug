import { create } from 'zustand';
import type { ReactionStore } from './reactions.types';

export const createReactionStore = () => {
  // SSR safety check
  if (typeof window === 'undefined') return null;

  return create<ReactionStore>((set, get) => ({
    // Initial state
    reactions: [],
    isLoading: false,
    error: null,

    // State setters
    setReactions: (reactions) => set({ reactions }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Operations
    toggleReaction: async (messageId, emoji) => {
      try {
        set({ isLoading: true, error: null });
        // TODO: API call to toggle reaction
        const { reactions } = get();
        const existingReaction = reactions.find(
          r => r.message_id === messageId && r.emoji === emoji
        );

        if (existingReaction) {
          // Remove reaction
          const updatedReactions = reactions.filter(r => r.id !== existingReaction.id);
          set({ reactions: updatedReactions });
        } else {
          // Add reaction
          const newReaction = {
            id: Date.now().toString(),
            message_id: messageId,
            user_id: 'current-user', // TODO: Get from auth context
            emoji,
            created_at: new Date().toISOString(),
          };
          set({ reactions: [...reactions, newReaction] });
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to toggle reaction' });
      } finally {
        set({ isLoading: false });
      }
    },

    removeReaction: async (reactionId) => {
      try {
        set({ isLoading: true, error: null });
        // TODO: API call to remove reaction
        const { reactions } = get();
        const updatedReactions = reactions.filter(r => r.id !== reactionId);
        set({ reactions: updatedReactions });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to remove reaction' });
      } finally {
        set({ isLoading: false });
      }
    },
  }));
};
