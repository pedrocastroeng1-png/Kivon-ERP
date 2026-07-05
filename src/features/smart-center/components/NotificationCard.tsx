import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Megaphone, 
  PackageOpen, 
  Settings,
  CheckCircle2,
  Clock,
  Pin,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/src/shared/lib/utils';
import { AppNotification, NotificationType, NotificationPriority } from '../types';
import { Button } from '@/src/shared/components/ui/Button';

interface NotificationCardProps {
  key?: React.Key;
  notification: AppNotification;
  onRead: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType, label: string }> = {
  ALERT: { icon: AlertTriangle, label: 'Alerta' },
  COMMUNICATION: { icon: Megaphone, label: 'Comunicado' },
  UPDATE: { icon: PackageOpen, label: 'Atualização' },
  SYSTEM: { icon: Settings, label: 'Sistema' },
};

const priorityConfig: Record<NotificationPriority, { color: string, badge: string }> = {
  CRITICAL: { color: 'text-red-400', badge: 'bg-red-500/10 border-red-500/20 text-red-400' },
  HIGH: { color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  MEDIUM: { color: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  INFO: { color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400' }
};

export function NotificationCard({ 
  notification, 
  onRead, 
  onAcknowledge, 
  onResolve 
}: NotificationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const Icon = typeConfig[notification.type]?.icon || Info;
  const prioConfig = priorityConfig[notification.priority] || priorityConfig.INFO;
  
  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await onAcknowledge(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await onResolve(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
  };

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-200 overflow-hidden flex flex-col gap-3",
        notification.is_read 
          ? "bg-kivon-bg/50 border-kivon-border/50 opacity-70 hover:opacity-100" 
          : "bg-kivon-card border-kivon-border hover:border-kivon-primary/50 shadow-lg cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      {!notification.is_read && (
        <div className="absolute top-0 left-0 w-1 h-full bg-kivon-primary" />
      )}
      
      <div className="flex gap-4">
        <div className={cn("mt-1 shrink-0", prioConfig.color)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              {notification.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-kivon-primary fill-kivon-primary/20 rotate-45" />
              )}
              <h4 className={cn("font-semibold text-sm truncate", notification.is_read ? "text-white/80" : "text-white")}>
                {notification.title}
              </h4>
            </div>
            <span className="text-[10px] whitespace-nowrap text-kivon-text-sec font-medium flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.publish_at || notification.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          
          <p className="text-xs text-kivon-text-sec leading-relaxed line-clamp-3">
            {notification.description}
          </p>
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", prioConfig.badge)}>
              {notification.priority}
            </span>
            <span className="text-[10px] font-medium text-kivon-text-sec uppercase tracking-wider">
              {typeConfig[notification.type]?.label || notification.type}
            </span>
            {notification.resolved_at && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-green-500/10 border-green-500/20 text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Resolvido
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(!notification.is_acknowledged && notification.requires_acknowledgment) || (notification.type === 'ALERT' && !notification.resolved_at) ? (
        <div className="flex items-center gap-2 mt-1 border-t border-kivon-border/50 pt-3">
          {notification.requires_acknowledgment && !notification.is_acknowledged && (
            <Button 
              size="sm" 
              className="w-full text-xs h-8"
              onClick={handleAcknowledge}
              disabled={isProcessing}
              variant={notification.is_read ? "secondary" : "primary"}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Confirmar Ciência
            </Button>
          )}
          
          {notification.type === 'ALERT' && !notification.resolved_at && (
            <Button 
              size="sm" 
              variant="outline"
              className="w-full text-xs h-8 border-kivon-border text-white hover:bg-kivon-hover hover:text-white"
              onClick={handleResolve}
              disabled={isProcessing}
            >
              Resolver Alerta
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
