import { useMemo, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import { mutate } from 'swr';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { AppNotification } from '../types';
import { useNotificationStore } from '../store/notificationStore';
import { NOTIFICATIONS_CACHE_KEY } from '../providers/NotificationRealtimeProvider';

const PAGE_SIZE = 15;

export function useNotifications() {
  const { user } = useAuth();
  const { activeFilter } = useNotificationStore();

  const getKey = (pageIndex: number, previousPageData: AppNotification[] | null) => {
    if (!user) return null; // Unauthenticated
    if (previousPageData && !previousPageData.length) return null; // Reached the end
    return `${NOTIFICATIONS_CACHE_KEY}?page=${pageIndex}&limit=${PAGE_SIZE}`; // SWR key
  };

  const fetcher = async (url: string) => {
    const params = new URLSearchParams(url.split('?')[1]);
    const page = parseInt(params.get('page') || '0', 10);
    const limit = parseInt(params.get('limit') || '15', 10);
    return await NotificationService.fetchUserNotifications(page, limit);
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate: mutateLocal } = useSWRInfinite<AppNotification[]>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const notifications = useMemo(() => {
    return data ? data.flat() : [];
  }, [data]);

  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

  const loadMore = useCallback(() => {
    if (!isReachingEnd && !isValidating) {
      setSize(size + 1);
    }
  }, [isReachingEnd, isValidating, size, setSize]);

  // Derived State & Filtering
  const filteredNotifications = useMemo(() => {
    let result = notifications;

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

  // Actions with Optimistic Updates for SWR Infinite (requires mutating the 2D array)
  const mutateItem = (id: string, updater: (item: AppNotification) => AppNotification) => {
    mutateLocal(
      (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((pageData) =>
          pageData.map((n) => (n.id === id ? updater(n) : n))
        );
      },
      false
    );
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    mutateItem(id, (n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }));

    try {
      await NotificationService.markAsRead(id);
    } catch (err) {
      mutateLocal();
      throw err;
    }
  };

  const acknowledge = async (id: string) => {
    if (!user) return;

    mutateItem(id, (n) => ({ 
      ...n, 
      is_read: true, 
      is_acknowledged: true, 
      read_at: n.read_at || new Date().toISOString(), 
      acknowledged_at: new Date().toISOString() 
    }));

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
      (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((pageData) =>
          pageData.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }))
        );
      },
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
    
    mutateLocal(
      (currentData) => {
        if (!currentData) return currentData;
        return currentData.map((pageData) =>
          pageData.filter((n) => n.id !== id)
        );
      },
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
    isValidating,
    isReachingEnd,
    isEmpty,
    error,
    loadMore,
    markAsRead,
    acknowledge,
    markAllAsRead,
    resolve,
    refresh: () => mutateLocal(),
  };
}
