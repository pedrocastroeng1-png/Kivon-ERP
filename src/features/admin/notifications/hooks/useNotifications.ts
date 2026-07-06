import { useState, useCallback, useEffect } from 'react';
import { NotificationRecord, NotificationFilters, NotificationStats } from '../types';
import { NotificationService } from '../services/NotificationService';
import toast from 'react-hot-toast';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});

  const fetchNotifications = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        NotificationService.getNotifications(currentFilters),
        NotificationService.getStats()
      ]);
      setNotifications(data);
      setStats(statsData);
    } catch (err: unknown) {
      toast.error('Erro ao buscar notificações: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updateFilters = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
  };

  const createNotification = async (payload: Partial<NotificationRecord>) => {
    try {
      await NotificationService.createNotification(payload);
      toast.success('Notificação criada com sucesso.');
      fetchNotifications();
      return true;
    } catch (err: unknown) {
      toast.error('Erro ao criar notificação: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  };

  const updateNotification = async (id: string, payload: Partial<NotificationRecord>) => {
    try {
      await NotificationService.updateNotification(id, payload);
      toast.success('Notificação atualizada com sucesso.');
      fetchNotifications();
      return true;
    } catch (err: unknown) {
      toast.error('Erro ao atualizar notificação: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return false;
    
    try {
      await NotificationService.deleteNotification(id);
      toast.success('Notificação excluída.');
      fetchNotifications();
      return true;
    } catch (err: unknown) {
      toast.error('Erro ao excluir notificação: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  };

  const resolveNotification = async (id: string) => {
    if (!confirm('Tem certeza que deseja resolver esta notificação? Ela não será mais mostrada aos usuários.')) return false;
    
    try {
      await NotificationService.resolveNotification(id);
      toast.success('Notificação resolvida.');
      fetchNotifications();
      return true;
    } catch (err: unknown) {
      toast.error('Erro ao resolver notificação: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  };

  const duplicateNotification = async (notification: NotificationRecord) => {
    try {
      const { id, created_at, updated_at, resolved_at, resolved_by, created_by, ...payload } = notification;
      await NotificationService.createNotification({
        ...payload,
        status: 'DRAFT',
        title: `${payload.title} (Cópia)`
      });
      toast.success('Notificação duplicada.');
      fetchNotifications();
      return true;
    } catch (err: unknown) {
      toast.error('Erro ao duplicar notificação: ' + (err instanceof Error ? err.message : String(err)));
      return false;
    }
  };

  return {
    notifications,
    stats,
    loading,
    filters,
    updateFilters,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    resolveNotification,
    duplicateNotification
  };
}
