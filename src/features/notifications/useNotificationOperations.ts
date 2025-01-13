import { useNotificationContext } from './NotificationProvider';

export function useNotificationOperations() {
  const store = useNotificationContext();
  
  return {
    markAsRead: store.markAsRead,
    clearNotification: store.clearNotification,
    clearAllNotifications: store.clearAllNotifications,
  };
}
