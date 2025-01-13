import { useReactionContext } from './ReactionProvider';

export function useReactionOperations() {
  const store = useReactionContext();
  
  return {
    toggleReaction: store.toggleReaction,
    removeReaction: store.removeReaction,
  };
}
