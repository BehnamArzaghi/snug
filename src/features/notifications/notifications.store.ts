import { create } from 'zustand';
import type { NotificationStore } from './notifications.types';

export const createNotificationStore = () => {
  // SSR safety check
  if (typeof window === 'undefined') return null;

  return create<NotificationStore>((set, get) => ({
    // Initial state
    notifications: [],
    isLoading: false,
    error: null,

    // State setters
    setNotifications: (notifications) => set({ notifications }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Operations
    markAsRead: async (notificationId) => {
      try {
        set({ isLoading: true, error: null });
        // TODO: API call to mark notification as read
        const { notifications } = get();
        const updatedNotifications = notifications.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        );
        set({ notifications: updatedNotifications });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to mark notification as read' });
      } finally {
        set({ isLoading: false });
      }
    },

    clearNotification: async (notificationId) => {
      try {
        set({ isLoading: true, error: null });
        // TODO: API call to delete notification
        const { notifications } = get();
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        set({ notifications: updatedNotifications });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to clear notification' });
      } finally {
        set({ isLoading: false });
      }
    },

    clearAllNotifications: async () => {
      try {
        set({ isLoading: true, error: null });
        // TODO: API call to clear all notifications
        set({ notifications: [] });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to clear notifications' });
      } finally {
        set({ isLoading: false });
      }
    },
  }));
};
