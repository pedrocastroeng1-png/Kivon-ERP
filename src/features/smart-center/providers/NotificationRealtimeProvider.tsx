import React, { useEffect, useRef } from 'react';
import { mutate } from 'swr';
import { supabase } from '@/src/shared/lib/supabase';
import { useAuth } from '@/src/app/providers/AuthProvider';

export const NOTIFICATIONS_CACHE_KEY = 'user_notifications';

export function NotificationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      return;
    }

    const channel = supabase.channel('smart_center_realtime');
    
    // Invalidate SWR Infinite keys
    const invalidateCache = () => {
      mutate(
        (key) => typeof key === 'string' && key.startsWith(NOTIFICATIONS_CACHE_KEY),
        undefined,
        { revalidate: true }
      );
    };
    
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          invalidateCache();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notification_reads' },
        (payload) => {
          if (payload.new && 'user_id' in payload.new && payload.new.user_id === user.id) {
            invalidateCache();
          } else if (payload.old && 'user_id' in payload.old && payload.old.user_id === user.id) {
             invalidateCache();
          }
        }
      );

    channel.subscribe((status, err) => {
      if (err) {
        console.error('Realtime subscription error:', err);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  return <>{children}</>;
}
