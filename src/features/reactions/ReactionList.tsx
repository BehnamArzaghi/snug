import { useReactions } from './useReactions';
import { useReactionOperations } from './useReactionOperations';
import { cn } from '@/lib/utils';

interface ReactionListProps {
  messageId: string;
  className?: string;
}

export function ReactionList({ messageId, className }: ReactionListProps) {
  const { reactions, isLoading, error } = useReactions();
  const { toggleReaction } = useReactionOperations();

  // Filter reactions for this message and group by emoji
  const messageReactions = reactions
    .filter(r => r.message_id === messageId)
    .reduce((acc, reaction) => {
      const key = reaction.emoji;
      if (!acc[key]) {
        acc[key] = { emoji: key, count: 0, users: [] };
      }
      acc[key].count++;
      acc[key].users.push(reaction.user_id);
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: string[] }>);

  if (isLoading) {
    return (
      <div className={cn('flex space-x-2', className)}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-xs text-red-500', className)}>
        Error loading reactions
      </div>
    );
  }

  if (Object.keys(messageReactions).length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Object.values(messageReactions).map(({ emoji, count, users }) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(messageId, emoji)}
          className={cn(
            'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm',
            'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
          title={users.join(', ')}
        >
          <span>{emoji}</span>
          <span className="text-gray-600 dark:text-gray-400">{count}</span>
        </button>
      ))}
    </div>
  );
}
