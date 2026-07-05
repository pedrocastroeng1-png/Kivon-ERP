import React, { useEffect, useRef } from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from '@/src/shared/components/ui/Button';
import { NotificationCard } from './NotificationCard';
import { NotificationFilters } from './NotificationFilters';
import { useNotificationStore } from '../store/notificationStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartCenterDrawer({ isOpen, onClose }: Props) {
  const { 
    notifications, 
    isLoading, 
    isValidating,
    isReachingEnd,
    isEmpty,
    loadMore,
    unreadCount,
    unacknowledgedCount,
    markAsRead, 
    markAllAsRead,
    acknowledge,
    resolve
  } = useNotifications();
  
  // Use store for drawer open state instead of local state in AppLayout
  const { setIsOpen } = useNotificationStore();

  useEffect(() => {
    setIsOpen(isOpen);
  }, [isOpen, setIsOpen]);

  // Infinite Scroll Observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isValidating) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isReachingEnd, isValidating, loadMore]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] sm:max-w-md bg-kivon-card border-l border-kivon-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-kivon-border bg-kivon-bg/50">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl bg-kivon-primary/10 flex items-center justify-center border border-kivon-primary/20">
              <Bell className="h-5 w-5 text-kivon-primary" />
              {unacknowledgedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-kivon-card" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Central Inteligente</h2>
              <p className="text-xs font-medium text-kivon-text-sec">
                {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
                {unacknowledgedCount > 0 && ` • ${unacknowledgedCount} pendentes`}
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

        {/* Filters */}
        <NotificationFilters />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          
          {/* Initial Loading State */}
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-pulse flex flex-col items-center gap-3">
                <div className="h-8 w-8 rounded-full border-2 border-kivon-primary border-t-transparent animate-spin" />
                <span className="text-sm text-kivon-text-sec">Carregando central...</span>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="py-16 flex flex-col items-center text-center px-6 h-full justify-center">
              <div className="h-16 w-16 rounded-full bg-kivon-bg flex items-center justify-center mb-4 border border-kivon-border">
                <CheckCircle2 className="h-8 w-8 text-kivon-text-sec opacity-50" />
              </div>
              <p className="text-white font-medium mb-1">Tudo limpo por aqui</p>
              <p className="text-sm text-kivon-text-sec">Nenhuma notificação encontrada para este filtro.</p>
            </div>
          ) : (
            <>
              {notifications.map(item => (
                <NotificationCard 
                  key={item.id} 
                  notification={item} 
                  onRead={markAsRead}
                  onAcknowledge={acknowledge}
                  onResolve={resolve}
                />
              ))}
              
              {/* Infinite Scroll Trigger & Validating indicator */}
              <div ref={observerTarget} className="py-4 flex justify-center">
                {isValidating && !isReachingEnd && (
                   <div className="h-5 w-5 rounded-full border-2 border-kivon-primary border-t-transparent animate-spin" />
                )}
                {isReachingEnd && notifications.length > 0 && (
                  <span className="text-xs text-kivon-text-sec">Fim das notificações</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {unreadCount > 0 && (
          <div className="p-4 border-t border-kivon-border bg-kivon-bg shrink-0">
            <Button 
              variant="secondary" 
              className="w-full h-10 bg-kivon-card border-kivon-border text-kivon-text-sec hover:text-white"
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
