export type NotificationType = 'mention' | 'reply' | 'reaction' | 'channel_invite';

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  user_id: string;
  target_id?: string;  // Message ID, Channel ID, etc.
  created_at: string;
  read_at: string | null;
}

export interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

export interface NotificationStore extends NotificationState {
  // State setters
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Operations
  markAsRead: (notificationId: string) => Promise<void>;
  clearNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}
