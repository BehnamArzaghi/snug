import { useChannels } from './useChannels';
import { useChannelOperations } from './useChannelOperations';
import { useAuth } from '@/features/auth/useAuth';

interface ChannelDetailProps {
  channelId: string;
}

export function ChannelDetail({ channelId }: ChannelDetailProps) {
  const { channels, isLoading, error } = useChannels();
  const { updateChannel } = useChannelOperations();
  const { user } = useAuth();

  const channel = channels[channelId];

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
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

  if (!channel) {
    return (
      <div className="p-4 text-gray-500">
        Channel not found
      </div>
    );
  }

  const isOwner = channel.created_by === user?.id;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">#</span>
            <span>{channel.name}</span>
          </h2>
          {channel.is_private && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
              Private
            </span>
          )}
        </div>
        {channel.description && (
          <p className="text-gray-600 dark:text-gray-300">
            {channel.description}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>Created {new Date(channel.created_at).toLocaleDateString()}</p>
          {channel.updated_at && (
            <p>Last updated {new Date(channel.updated_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              const newDescription = window.prompt('Enter new description:', channel.description);
              if (newDescription !== null) {
                updateChannel(channel.id, { description: newDescription });
              }
            }}
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Edit Description
          </button>
        </div>
      )}
    </div>
  );
}
