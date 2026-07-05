import { useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { supabase } from '@/src/shared/lib/supabase';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { AppNotification } from '../types';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATIONS_CACHE_KEY = 'user_notifications';

export function useNotifications() {
  const { user } = useAuth();
  const { activeFilter } = useNotificationStore();

  // SWR Fetcher
  const fetcher = async () => {
    if (!user) return [];
    return await NotificationService.fetchUserNotifications();
  };

  // 1. Data Fetching & Caching (SWR)
  const { data: notifications = [], error, isLoading, mutate: mutateLocal } = useSWR<AppNotification[]>(
    user ? NOTIFICATIONS_CACHE_KEY : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // 2. Realtime Synchronization
  useEffect(() => {
    if (!user) return;

    // We listen to both notifications and notification_reads tables
    // to keep the view 'vw_user_notifications' perfectly synced
    const channel = supabase.channel('smart_center_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Revalidate SWR cache globally
          mutate(NOTIFICATIONS_CACHE_KEY);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_reads' },
        (payload) => {
          // Only revalidate if it affects the current user
          if (payload.new && 'user_id' in payload.new && payload.new.user_id === user.id) {
            mutate(NOTIFICATIONS_CACHE_KEY);
          } else if (payload.old && 'user_id' in payload.old && payload.old.user_id === user.id) {
             mutate(NOTIFICATIONS_CACHE_KEY);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 3. Derived State & Filtering
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Apply store filters
    if (activeFilter === 'UNREAD') {
      result = result.filter((n) => !n.is_read);
    } else if (activeFilter !== 'ALL') {
      result = result.filter((n) => n.type === activeFilter);
    }

    return result;
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  const unacknowledgedCount = useMemo(() => {
    return notifications.filter((n) => n.requires_acknowledgment && !n.is_acknowledged).length;
  }, [notifications]);

  // 4. Actions with Optimistic Updates
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    // Optimistic Update
    mutateLocal(
      (current) => 
        current?.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      false // don't revalidate immediately
    );

    try {
      await NotificationService.markAsRead(id);
      // Actual revalidation happens via realtime subscription or next focus
    } catch (err) {
      // Revert on failure by triggering a revalidation
      mutateLocal();
      throw err;
    }
  };

  const acknowledge = async (id: string) => {
    if (!user) return;

    mutateLocal(
      (current) => 
        current?.map((n) => (n.id === id ? { ...n, is_read: true, is_acknowledged: true, read_at: new Date().toISOString(), acknowledged_at: new Date().toISOString() } : n)),
      false
    );

    try {
      await NotificationService.acknowledge(id);
    } catch (err) {
      mutateLocal();
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    mutateLocal(
      (current) => 
        current?.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })),
      false
    );

    try {
      await NotificationService.markAllAsRead();
    } catch (err) {
      mutateLocal();
      throw err;
    }
  };

  const resolve = async (id: string) => {
    if (!user) return;
    
    // For resolution, optimistic UI is slightly harder since it might remove it from view
    mutateLocal(
      (current) => 
        current?.filter((n) => n.id !== id),
      false
    );

    try {
      await NotificationService.resolve(id);
    } catch (err) {
      mutateLocal();
      throw err;
    }
  }

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    unreadCount,
    unacknowledgedCount,
    isLoading,
    error,
    markAsRead,
    acknowledge,
    markAllAsRead,
    resolve,
    refresh: () => mutateLocal(),
  };
}
