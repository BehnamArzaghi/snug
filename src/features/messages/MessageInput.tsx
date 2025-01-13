import { useState, useRef, KeyboardEvent } from 'react';
import { useMessageOperations } from './useMessageOperations';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  channelId: string;
  className?: string;
}

export function MessageInput({ channelId, className }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useMessageOperations();

  const handleSubmit = async () => {
    if (!content.trim() && !isUploading) return;

    try {
      await sendMessage(channelId, content);
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('p-4 border-t border-gray-200 dark:border-gray-800', className)}>
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              'w-full resize-none rounded-lg border border-gray-300 dark:border-gray-700',
              'bg-white dark:bg-gray-800 p-2 focus:outline-none focus:ring-2',
              'focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[80px]'
            )}
            disabled={isUploading}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={() => {
              // TODO: Implement file upload
              console.log('File upload not implemented yet');
            }}
          />
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'p-2 rounded-lg text-gray-500 hover:text-gray-700',
              'dark:text-gray-400 dark:hover:text-gray-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            disabled={isUploading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isUploading}
            className={cn(
              'p-2 rounded-lg bg-blue-500 text-white',
              'hover:bg-blue-600 focus:outline-none focus:ring-2',
              'focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
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
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
