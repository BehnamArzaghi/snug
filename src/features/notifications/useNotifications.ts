import { useNotificationContext } from './NotificationProvider';

export function useNotifications() {
  const store = useNotificationContext();
  
  return {
    notifications: store.notifications,
    isLoading: store.isLoading,
    error: store.error,
  };
}
