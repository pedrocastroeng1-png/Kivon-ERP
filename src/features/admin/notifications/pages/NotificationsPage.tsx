import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationTable } from '../components/NotificationTable';
import { NotificationStats } from '../components/NotificationStats';
import { NotificationModal } from '../components/NotificationModal';
import { NotificationViewModal } from '../components/NotificationViewModal';
import { NotificationRecord } from '../types';
import { Plus, Search, Filter, RefreshCw, Loader2, Megaphone } from 'lucide-react';

export default function NotificationsPage() {
  const {
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
  } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);

  const handleOpenNew = () => {
    setSelectedNotification(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: NotificationRecord) => {
    setSelectedNotification(n);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: Partial<NotificationRecord>) => {
    if (selectedNotification) {
      return await updateNotification(selectedNotification.id, payload);
    } else {
      return await createNotification(payload);
    }
  };

  const handleView = (n: NotificationRecord) => {
    setSelectedNotification(n);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-kivon-primary" />
            Central Inteligente
          </h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie e monitore as notificações de todo o ERP KIVON.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchNotifications}
            className="p-2 text-kivon-text-sec hover:text-white rounded-md bg-kivon-card border border-kivon-border transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenNew}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-kivon-primary px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-kivon-primary/20 hover:bg-kivon-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kivon-primary transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            Nova Notificação
          </button>
        </div>
      </div>

      <NotificationStats stats={stats} />

      <div className="bg-kivon-card border border-kivon-border rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-kivon-text-sec" />
              </div>
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-kivon-border rounded-md bg-kivon-bg text-white placeholder-kivon-text-sec focus:ring-kivon-primary focus:border-kivon-primary sm:text-sm"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <select
                value={filters.status || ''}
                onChange={(e) => updateFilters({ ...filters, status: (e.target.value as NotificationRecord['status']) || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-3 py-2 text-white sm:text-sm focus:ring-kivon-primary focus:border-kivon-primary outline-none min-w-[120px]"
              >
                <option value="">Status (Todos)</option>
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Arquivado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
              
              <select
                value={filters.priority || ''}
                onChange={(e) => updateFilters({ ...filters, priority: (e.target.value as NotificationRecord['priority']) || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-3 py-2 text-white sm:text-sm focus:ring-kivon-primary focus:border-kivon-primary outline-none min-w-[140px]"
              >
                <option value="">Prioridade (Todas)</option>
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="INFO">Informação</option>
              </select>

              <select
                value={filters.type || ''}
                onChange={(e) => updateFilters({ ...filters, type: (e.target.value as NotificationRecord['type']) || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-3 py-2 text-white sm:text-sm focus:ring-kivon-primary focus:border-kivon-primary outline-none min-w-[120px]"
              >
                <option value="">Tipo (Todos)</option>
                <option value="ALERT">Alerta</option>
                <option value="COMMUNICATION">Comunicado</option>
                <option value="UPDATE">Atualização</option>
                <option value="SYSTEM">Sistema</option>
              </select>

              <select
                value={filters.target_type || ''}
                onChange={(e) => updateFilters({ ...filters, target_type: (e.target.value as NotificationRecord['target_type']) || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-3 py-2 text-white sm:text-sm focus:ring-kivon-primary focus:border-kivon-primary outline-none min-w-[120px]"
              >
                <option value="">Alvo (Todos)</option>
                <option value="GLOBAL">Global</option>
                <option value="ROLE">Cargo/Perfil</option>
                <option value="PROJECT">Obra/Projeto</option>
                <option value="USER">Usuário</option>
              </select>

              <select
                value={filters.source || ''}
                onChange={(e) => updateFilters({ ...filters, source: (e.target.value as NotificationRecord['source']) || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-3 py-2 text-white sm:text-sm focus:ring-kivon-primary focus:border-kivon-primary outline-none min-w-[120px]"
              >
                <option value="">Origem (Todas)</option>
                <option value="system">Sistema</option>
                <option value="manual">Manual</option>
                <option value="presence">Presença</option>
                <option value="employees">Funcionários</option>
                <option value="projects">Projetos</option>
                <option value="update">Atualização</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-start border-t border-kivon-border pt-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-kivon-text-sec shrink-0">Publicado entre:</span>
              <input
                type="date"
                value={filters.publishDateStart || ''}
                onChange={(e) => updateFilters({ ...filters, publishDateStart: e.target.value || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-2 py-1 text-white text-sm focus:ring-kivon-primary focus:border-kivon-primary"
              />
              <span className="text-sm text-kivon-text-sec shrink-0">e</span>
              <input
                type="date"
                value={filters.publishDateEnd || ''}
                onChange={(e) => updateFilters({ ...filters, publishDateEnd: e.target.value || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-2 py-1 text-white text-sm focus:ring-kivon-primary focus:border-kivon-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-kivon-text-sec shrink-0">Expira entre:</span>
              <input
                type="date"
                value={filters.expiresDateStart || ''}
                onChange={(e) => updateFilters({ ...filters, expiresDateStart: e.target.value || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-2 py-1 text-white text-sm focus:ring-kivon-primary focus:border-kivon-primary"
              />
              <span className="text-sm text-kivon-text-sec shrink-0">e</span>
              <input
                type="date"
                value={filters.expiresDateEnd || ''}
                onChange={(e) => updateFilters({ ...filters, expiresDateEnd: e.target.value || undefined })}
                className="border border-kivon-border rounded-md bg-kivon-bg px-2 py-1 text-white text-sm focus:ring-kivon-primary focus:border-kivon-primary"
              />
            </div>
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-kivon-text-sec border border-kivon-border rounded-lg bg-kivon-bg/50">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-kivon-primary" />
            <p>Carregando notificações...</p>
          </div>
        ) : (
          <NotificationTable 
            notifications={notifications}
            onView={handleView}
            onEdit={handleOpenEdit}
            onDuplicate={duplicateNotification}
            onResolve={resolveNotification}
            onArchive={(n) => updateNotification(n.id, { status: 'ARCHIVED' })}
            onDelete={deleteNotification}
          />
        )}
      </div>

      <NotificationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={selectedNotification}
      />

      <NotificationViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        notification={selectedNotification}
      />
    </div>
  );
}
