'use client'

import React, { useState, useCallback, memo } from 'react';
import { useMessage, useThreadMessages, useMessageLoading, useMessageActions } from '@/hooks/useMessage';
import { Message } from './Message';
import MessageLoading from '@/components/messages/MessageLoading';
import { Button } from '@/components/ui/button';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';

interface ThreadViewProps {
  parentMessageId: string;
  onClose?: () => void;
  className?: string;
}

export const ThreadView = memo(function ThreadView({
  parentMessageId,
  onClose,
  className,
}: ThreadViewProps) {
  const [replyContent, setReplyContent] = useState('');
  const parentMessage = useMessage(parentMessageId);
  const threadMessages = useThreadMessages(parentMessageId);
  const isLoading = useMessageLoading();
  const { addMessage } = useMessageActions();

  const handleSendReply = useCallback(async () => {
    if (!replyContent.trim() || !parentMessage) return;

    try {
      await addMessage({
        content: replyContent,
        channel_id: parentMessage.channel_id,
        parent_message_id: parentMessageId,
        user_id: 'current-user', // This should come from auth context
        created_at: new Date().toISOString(),
        edited_at: null,
        edited_by: null,
        file_url: null,
        attachment_path: null,
        id: crypto.randomUUID(),
        user: {
          id: 'current-user',
          name: 'Current User',
          email: 'user@example.com',
          avatar_url: null,
          created_at: new Date().toISOString(),
          last_seen: null,
        },
      });
      setReplyContent('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  }, [replyContent, parentMessage, parentMessageId, addMessage]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReplyContent(e.target.value);
  }, []);

  if (!parentMessageId || !parentMessage) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Thread</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b bg-muted/30">
          <Message messageId={parentMessageId} showThread={false} />
        </div>

        <div className="flex flex-col gap-0.5 p-4">
          {isLoading ? (
            <>
              <MessageLoading />
              <MessageLoading />
            </>
          ) : threadMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No replies yet. Start the thread!
            </div>
          ) : (
            threadMessages.map((message) => (
              <Message
                key={message.id}
                messageId={message.id}
                showThread={false}
                isThreadReply
              />
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <Textarea
          value={replyContent}
          onChange={handleContentChange}
          placeholder="Reply in thread..."
          className="min-h-[100px]"
        />
        <div className="flex justify-end mt-2">
          <Button 
            onClick={handleSendReply}
            disabled={!replyContent.trim()}
          >
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}); 