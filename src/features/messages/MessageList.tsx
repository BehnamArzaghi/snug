import { useMessages } from './useMessages';
import { useMessageOperations } from './useMessageOperations';
import { useAuth } from '@/features/auth/useAuth';

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { messageList, isLoading, error } = useMessages();
  const { deleteMessage } = useMessageOperations();
  const { user } = useAuth();

  // Filter messages for this channel
  const channelMessages = messageList.filter(msg => msg.channel_id === channelId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (channelMessages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {channelMessages.map((message) => (
        <div key={message.id} className="group flex space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <span className="text-sm font-semibold">
              {message.user_id[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">
                {message.user_id}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleString()}
              </span>
              {message.edited_at && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            <p className="text-gray-900 dark:text-gray-100">
              {message.content}
            </p>
            {message.file_url && (
              <a 
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                Attached File
              </a>
            )}
          </div>
          {user && message.user_id === user.id && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => deleteMessage(message.id)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
