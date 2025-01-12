import { memo } from 'react';
import { MoreVertical, Pencil, Trash2, Reply } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Message } from '@/store/types';

export interface MessageActionsProps {
  message: Message;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  className?: string;
}

export const MessageActions = memo(function MessageActions({
  message,
  onEdit,
  onDelete,
  className
}: MessageActionsProps) {
  const { user } = useAuth();
  
  const canEdit = user?.id === message.user_id;
  const canDelete = user?.id === message.user_id;

  if (!canEdit && !canDelete) return null;

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open message actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}); 