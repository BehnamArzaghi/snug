import { useNotifications } from './useNotifications';
import { useNotificationOperations } from './useNotificationOperations';
import { cn } from '@/lib/utils';

interface NotificationListProps {
  className?: string;
}

export function NotificationList({ className }: NotificationListProps) {
  const { notifications, isLoading, error } = useNotifications();
  const { markAsRead, clearNotification } = useNotificationOperations();

  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-red-500', className)}>
        Error: {error}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn('p-4 text-center text-gray-500', className)}>
        No notifications
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-gray-200 dark:divide-gray-800', className)}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'p-4 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
            !notification.read_at && 'bg-blue-50 dark:bg-blue-900/10'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                {notification.type === 'mention' ? '@' : '•'}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {notification.content}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read_at && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                >
                  Mark as read
                </button>
              )}
              <button
                onClick={() => clearNotification(notification.id)}
                className="text-xs text-gray-500 hover:text-gray-600 dark:text-gray-400"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
