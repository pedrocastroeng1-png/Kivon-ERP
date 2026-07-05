import React, { useState } from 'react';
import { X, Bell, Info, AlertTriangle, Megaphone, CheckCircle2, PackageOpen } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSmartCenter } from '../hooks/useSmartCenter';
import { SmartItemType, SmartItemPriority } from '../types';
import { Button } from '@/src/shared/components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig: Record<SmartItemType, { icon: React.ElementType, label: string }> = {
  ALERT: { icon: AlertTriangle, label: 'Alerta' },
  COMMUNICATION: { icon: Megaphone, label: 'Comunicado' },
  UPDATE: { icon: PackageOpen, label: 'Atualização' }
};

const priorityConfig: Record<SmartItemPriority, { color: string, badge: string }> = {
  CRITICAL: { color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20 text-red-400' },
  HIGH: { color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  MEDIUM: { color: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  INFO: { color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }
};

type FilterType = 'ALL' | 'UNREAD' | SmartItemType;

export function SmartCenterDrawer({ isOpen, onClose }: Props) {
  const { items, loading, unreadCount, markAsRead, markAllAsRead } = useSmartCenter();
  const [filter, setFilter] = useState<FilterType>('ALL');

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    if (filter === 'UNREAD') return !item.read;
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-kivon-card border-l border-kivon-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-kivon-border bg-kivon-bg/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-kivon-primary/10 flex items-center justify-center border border-kivon-primary/20">
              <Bell className="h-5 w-5 text-kivon-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Central Inteligente</h2>
              <p className="text-xs font-medium text-kivon-text-sec">
                {unreadCount} {unreadCount === 1 ? 'pendência' : 'pendências'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-kivon-text-sec hover:text-white rounded-lg hover:bg-kivon-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-kivon-border flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterBadge active={filter === 'ALL'} onClick={() => setFilter('ALL')}>Todas</FilterBadge>
          <FilterBadge active={filter === 'UNREAD'} onClick={() => setFilter('UNREAD')}>Não lidas</FilterBadge>
          <FilterBadge active={filter === 'ALERT'} onClick={() => setFilter('ALERT')}>Alertas</FilterBadge>
          <FilterBadge active={filter === 'COMMUNICATION'} onClick={() => setFilter('COMMUNICATION')}>Comunicados</FilterBadge>
          <FilterBadge active={filter === 'UPDATE'} onClick={() => setFilter('UPDATE')}>Atualizações</FilterBadge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-kivon-primary border-t-transparent animate-spin" />
                <span className="text-sm text-kivon-text-sec">Analisando dados...</span>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center px-6">
              <div className="h-16 w-16 rounded-full bg-kivon-hover flex items-center justify-center mb-4 border border-kivon-border">
                <CheckCircle2 className="h-8 w-8 text-kivon-text-sec opacity-50" />
              </div>
              <p className="text-white font-medium mb-1">Tudo limpo por aqui</p>
              <p className="text-sm text-kivon-text-sec">Nenhuma notificação encontrada com este filtro.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const Icon = typeConfig[item.type].icon;
              const prioConfig = priorityConfig[item.priority];
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    item.read 
                      ? "bg-kivon-bg/50 border-kivon-border/50 opacity-70 hover:opacity-100" 
                      : "bg-kivon-card border-kivon-border hover:border-kivon-primary/50 shadow-lg"
                  )}
                  onClick={() => !item.read && markAsRead(item.id)}
                >
                  {!item.read && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-kivon-primary" />
                  )}
                  <div className="flex gap-4">
                    <div className={cn("mt-1 shrink-0", prioConfig.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn("font-semibold text-sm truncate", item.read ? "text-white/80" : "text-white")}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] whitespace-nowrap text-kivon-text-sec font-medium">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-kivon-text-sec leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", prioConfig.badge)}>
                          {item.priority}
                        </span>
                        <span className="text-[10px] font-medium text-kivon-text-sec uppercase tracking-wider">
                          {typeConfig[item.type].label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {unreadCount > 0 && (
          <div className="p-4 border-t border-kivon-border bg-kivon-bg">
            <Button 
              variant="secondary" 
              className="w-full h-12 bg-kivon-card border-kivon-border text-kivon-text-sec hover:text-white"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function FilterBadge({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
        active 
          ? "bg-kivon-primary text-black shadow-sm" 
          : "bg-kivon-bg border border-kivon-border text-kivon-text-sec hover:text-white hover:border-kivon-text-sec/50"
      )}
    >
      {children}
    </button>
  );
}
