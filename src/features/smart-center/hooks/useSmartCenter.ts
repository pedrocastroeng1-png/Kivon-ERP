import { useNotifications } from './useNotifications';

/**
 * @deprecated Use useNotifications instead. This is maintained to prevent build errors in AppLayout during Phase 2.
 */
export function useSmartCenter() {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  
  return {
    items: notifications,
    loading: isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh
  };
}
