import { useState } from 'react';
import { useReactionOperations } from './useReactionOperations';
import { cn } from '@/lib/utils';

const COMMON_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀', '🚀', '👎'];

interface ReactionPickerProps {
  messageId: string;
  className?: string;
}

export function ReactionPicker({ messageId, className }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleReaction } = useReactionOperations();

  const handleReaction = (emoji: string) => {
    toggleReaction(messageId, emoji);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
          'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-3.646 5.854a.5.5 0 00.708.708l2-2a.5.5 0 000-.708l-2-2a.5.5 0 00-.708.708L11.293 11H7.5a.5.5 0 000 1h3.793l-1.146 1.146z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={cn(
            'absolute bottom-full mb-2 p-2 rounded-lg shadow-lg',
            'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
            'flex flex-wrap gap-2 z-20'
          )}>
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={cn(
                  'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 