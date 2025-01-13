import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { useChannelOperations } from '@/features/channels/useChannelOperations';
import { useChannels } from '@/features/channels/useChannels';
import { MessageList } from '@/features/messages/MessageList';
import { MessageInput } from '@/features/messages/MessageInput';
import { useEffect } from 'react';

export default function ChannelPage() {
  const router = useRouter();
  const { channelId } = router.query;

  const { setActiveChannel } = useChannelOperations();
  const { activeChannel, isLoading, error } = useChannels();

  useEffect(() => {
    if (typeof channelId === 'string') {
      setActiveChannel(channelId);
    }
  }, [channelId, setActiveChannel]);

  return (
    <AppLayout>
      {isLoading ? (
        <div className="p-4">Loading channel...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : activeChannel ? (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-semibold">
              #{activeChannel.name}
            </h1>
            {activeChannel.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeChannel.description}
              </p>
            )}
          </div>
          {/* Messages + input */}
          <div className="flex-1 overflow-y-auto">
            <MessageList channelId={activeChannel.id} />
          </div>
          <MessageInput channelId={activeChannel.id} />
        </div>
      ) : (
        <div className="p-4 text-gray-500">No channel selected</div>
      )}
    </AppLayout>
  );
} 