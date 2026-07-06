import { supabase } from '@/src/shared/lib/supabase';
import { NotificationRecord, NotificationFilters, NotificationStats } from '../types';

export class NotificationService {
  static async getNotifications(filters?: NotificationFilters): Promise<NotificationRecord[]> {
    let query = supabase
      .from('notifications')
      .select('*, creator:users!created_by(full_name), resolver:users!resolved_by(full_name)')
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.target_type) query = query.eq('target_type', filters.target_type);
      if (filters.source) query = query.eq('source', filters.source);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.publishDateStart) {
        query = query.gte('publish_at', filters.publishDateStart);
      }
      if (filters.publishDateEnd) {
        query = query.lte('publish_at', filters.publishDateEnd + 'T23:59:59Z');
      }
      if (filters.expiresDateStart) {
        query = query.gte('expires_at', filters.expiresDateStart);
      }
      if (filters.expiresDateEnd) {
        query = query.lte('expires_at', filters.expiresDateEnd + 'T23:59:59Z');
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((d: Record<string, unknown>) => ({
      ...d,
      creator_name: (d.creator as { full_name?: string })?.full_name,
      resolver_name: (d.resolver as { full_name?: string })?.full_name,
    })) as unknown as NotificationRecord[];
  }

  static async getStats(): Promise<NotificationStats> {
    const { data: allData, error } = await supabase
      .from('notifications')
      .select('status, priority');

    if (error) throw error;

    const total = allData.length;
    const published = allData.filter(d => d.status === 'PUBLISHED').length;
    const drafts = allData.filter(d => d.status === 'DRAFT').length;
    const archived = allData.filter(d => d.status === 'ARCHIVED').length;
    const critical = allData.filter(d => d.priority === 'CRITICAL' && d.status === 'PUBLISHED').length;

    // Unread requires joining with notification_reads or fetching a view, but for admin panel "Unread Notifications"
    // often means how many users haven't read. Let's just return 0 for now or skip.
    return {
      total,
      published,
      drafts,
      archived,
      critical,
      unread: 0,
    };
  }

  static async createNotification(payload: Partial<NotificationRecord>): Promise<NotificationRecord> {
    const { data: user } = await supabase.auth.getUser();
    
    // We should not send creator_name, resolver_name to DB
    const { creator_name, resolver_name, ...dbPayload } = payload;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...dbPayload,
        created_by: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateNotification(id: string, payload: Partial<NotificationRecord>): Promise<NotificationRecord> {
    const { creator_name, resolver_name, ...dbPayload } = payload;
    
    // Validate state transitions
    const { data: current, error: fetchError } = await supabase
      .from('notifications')
      .select('status')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;

    if (current.status !== 'DRAFT') {
      const allowedKeys = ['status'];
      const keys = Object.keys(dbPayload);
      const isOnlyStatusUpdate = keys.length === 1 && keys[0] === 'status';
      
      if (!isOnlyStatusUpdate) {
        throw new Error("Não é possível editar o conteúdo de uma notificação que não seja um rascunho. Duplique-a se precisar fazer alterações.");
      }
      
      if (dbPayload.status === 'DRAFT') {
         throw new Error("Não é possível reverter uma notificação para rascunho.");
      }
      if (current.status === 'ARCHIVED' && dbPayload.status === 'PUBLISHED') {
         throw new Error("Não é possível republicar uma notificação arquivada.");
      }
    }
    
    const { data, error } = await supabase
      .from('notifications')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolveNotification(id: string): Promise<void> {
    const { error } = await supabase.rpc('resolve_notification', { p_notification_id: id });
    if (error) throw error;
  }

  static async deleteNotification(id: string): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('notifications')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (current.status !== 'DRAFT' && current.status !== 'ARCHIVED') {
      throw new Error("Apenas notificações em rascunho ou arquivadas podem ser excluídas.");
    }

    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  }

  static async getNotificationStats(id: string): Promise<{ read_count: number; ack_count: number }> {
    const { data, error } = await supabase
      .from('notification_reads')
      .select('read_at, acknowledged_at')
      .eq('notification_id', id);
      
    if (error) throw error;
    
    let read_count = 0;
    let ack_count = 0;
    
    data.forEach(d => {
      if (d.read_at) read_count++;
      if (d.acknowledged_at) ack_count++;
    });
    
    return { read_count, ack_count };
  }
}
