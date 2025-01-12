'use client'

import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChannelMessages, useMessageLoading } from '@/hooks/useMessage';
import { Message } from './Message';
import MessageLoading from '@/components/messages/MessageLoading';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { MessageErrorBoundary } from './MessageErrorBoundary';

interface MessageListProps {
  channelId: string;
  showThreads?: boolean;
}

interface VirtualMessageProps {
  virtualRow: VirtualItem;
  messageId: string;
  showThreads: boolean;
}

const VirtualMessage = memo(function VirtualMessage({
  virtualRow,
  messageId,
  showThreads,
}: VirtualMessageProps) {
  return (
    <div
      data-index={virtualRow.index}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start}px)`,
      }}
    >
      <MessageErrorBoundary>
        <Message
          messageId={messageId}
          showThread={showThreads}
        />
      </MessageErrorBoundary>
    </div>
  );
});

const LoadingState = memo(function LoadingState() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <MessageLoading />
      <MessageLoading />
      <MessageLoading />
    </div>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center text-muted-foreground py-8">
      No messages yet. Start the conversation!
    </div>
  );
});

export const MessageList = memo(function MessageList({
  channelId,
  showThreads = true,
}: MessageListProps) {
  console.log('[MessageList] Rendering for channel:', channelId);
  
  const messages = useChannelMessages(channelId);
  const isLoading = useMessageLoading();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const stableMessages = useMemo(() => {
    console.log('[MessageList] Sorting messages, count:', messages.length);
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  }, [messages]);
  
  const keyMap = useMemo(() => {
    return new Map(stableMessages.map((msg, index) => [msg.id, `${msg.id}-${index}`]));
  }, [stableMessages]);
  
  const virtualizer = useVirtualizer({
    count: stableMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 80, []),
    overscan: 5,
    getItemKey: useCallback((index: number) => keyMap.get(stableMessages[index].id) || stableMessages[index].id, [stableMessages, keyMap]),
  });

  useEffect(() => {
    if (parentRef.current && stableMessages.length > 0) {
      const scrollToBottom = () => {
        virtualizer.scrollToIndex(stableMessages.length - 1, { align: 'end' });
      };
      requestAnimationFrame(scrollToBottom);
    }
  }, [stableMessages.length, virtualizer]);

  if (!channelId) return null;
  
  if (isLoading && messages.length === 0) {
    console.log('[MessageList] Loading state active');
    return <LoadingState />;
  }

  if (stableMessages.length === 0) {
    console.log('[MessageList] No messages found');
    return <EmptyState />;
  }

  console.log('[MessageList] Rendering messages:', stableMessages.length);
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = stableMessages[virtualItem.index];
          return (
            <div
              key={keyMap.get(message.id)}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageErrorBoundary>
                <Message messageId={message.id} showThread={showThreads} />
              </MessageErrorBoundary>
            </div>
          );
        })}
      </div>
    </div>
  );
}); 