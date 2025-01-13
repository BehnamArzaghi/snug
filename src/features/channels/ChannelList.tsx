import { useChannels } from './useChannels';
import { useChannelOperations } from './useChannelOperations';
import { cn } from '@/lib/utils';

export function ChannelList() {
  const { channelList, activeChannelId, isLoading, error } = useChannels();
  const { setActiveChannel } = useChannelOperations();

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-9 rounded-md animate-pulse bg-gray-200 dark:bg-gray-800"
          />
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

  if (channelList.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No channels available
      </div>
    );
  }

  return (
    <div className="py-2">
      {channelList.map((channel) => (
        <button
          key={channel.id}
          onClick={() => setActiveChannel(channel.id)}
          className={cn(
            "w-full px-3 py-2 text-left rounded-md transition-colors",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700",
            activeChannelId === channel.id && "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">#</span>
            <span className="truncate">{channel.name}</span>
          </div>
          {channel.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate pl-5">
              {channel.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
