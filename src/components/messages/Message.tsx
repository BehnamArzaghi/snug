'use client';

import React, { useState, memo, useCallback, useMemo } from 'react';
import { useMessage, useMessageActions } from '@/hooks/useMessage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageActions } from './MessageActions';
import { cn, formatMessageTimestamp } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Message as MessageType } from '@/store/types';
import { MessageErrorBoundary } from './MessageErrorBoundary';
import { toast } from 'sonner';

interface MessageProps {
  messageId: string;
  showThread?: boolean;
  isThreadReply?: boolean;
  onThreadClick?: (messageId: string) => void;
  className?: string;
}

interface MessageContentProps {
  message: MessageType;
  isEditing: boolean;
  editContent: string;
  onEditChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MessageContent = memo(function MessageContent({
  message,
  isEditing,
  editContent,
  onEditChange,
  onSave,
  onCancel,
}: MessageContentProps) {
  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="min-h-[60px]"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm">{message.content}</p>
      {(message.file_url || message.attachment_path) && (
        <img 
          src={message.file_url || message.attachment_path || ''} 
          alt="Attached file" 
          className="max-w-md rounded-lg"
        />
      )}
    </>
  );
});

export const Message = memo(function Message({
  messageId,
  showThread = true,
  isThreadReply = false,
  onThreadClick,
  className,
}: MessageProps) {
  const message = useMessage(messageId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const { updateMessage, deleteMessage } = useMessageActions();

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
    setEditContent(message?.content || '');
  }, [message?.content]);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!message || !editContent.trim()) return;

    try {
      await updateMessage(message.id, editContent);
      setIsEditing(false);
      setEditContent('');
    } catch (error) {
      toast.error('Failed to update message');
    }
  }, [message, editContent, updateMessage]);

  const handleDelete = useCallback(async () => {
    if (!message) return;
    try {
      await deleteMessage(message.id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  }, [message, deleteMessage]);

  const formattedTimestamp = useMemo(() => {
    if (!message?.created_at) return '';
    return formatMessageTimestamp(message.created_at);
  }, [message?.created_at]);

  if (!message) return null;

  return (
    <div className={cn(
      'group flex gap-3 py-2 px-4 hover:bg-muted/50 relative',
      isThreadReply && 'pl-12',
      className
    )}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={message.user?.avatar_url || undefined} />
        <AvatarFallback>{message.user?.name?.[0] || '?'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {message.user?.name || 'Unknown User'}
          </span>
          <span className="text-xs text-muted-foreground" title={message.edited_at ? `Edited ${formatMessageTimestamp(message.edited_at)}` : formattedTimestamp}>
            {formattedTimestamp}
          </span>
          {message.edited_at && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        <MessageContent
          message={message}
          isEditing={isEditing}
          editContent={editContent}
          onEditChange={setEditContent}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />

        {!isEditing && (
          <MessageActions
            message={message}
            onEdit={handleEditStart}
            onDelete={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-2"
          />
        )}

        {showThread && !isThreadReply && message.parent_message_id === null && onThreadClick && (
          <button
            onClick={() => onThreadClick(message.id)}
            className="text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            Show Thread
          </button>
        )}
      </div>
    </div>
  );
}); 