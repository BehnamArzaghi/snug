import { useReactionContext } from './ReactionProvider';

export function useReactions() {
  const store = useReactionContext();
  
  return {
    reactions: store.reactions,
    isLoading: store.isLoading,
    error: store.error,
  };
}
