import { supabase } from '@/src/shared/lib/supabase';
import { AppNotification } from '../types';

export class NotificationService {
  /**
   * Fetches the user's active and targeted notifications with offset-based infinite pagination (cursor-like via SWR)
   */
  static async fetchUserNotifications(page: number = 0, limit: number = 20): Promise<AppNotification[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('vw_user_notifications')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('publish_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return (data || []) as AppNotification[];
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_as_read', {
      p_notification_id: notificationId
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async acknowledge(notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('acknowledge_notification', {
      p_notification_id: notificationId
    });

    if (error) {
      console.error('Error acknowledging notification:', error);
      throw error;
    }
  }

  static async markAllAsRead(): Promise<void> {
    const { error } = await supabase.rpc('mark_all_notifications_as_read');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async resolve(notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('resolve_notification', {
      p_notification_id: notificationId
    });

    if (error) {
      console.error('Error resolving notification:', error);
      throw error;
    }
  }
}
