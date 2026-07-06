import React, { useEffect, useState } from 'react';
import { NotificationRecord } from '../types';
import { X, Calendar, User, Tag, Clock, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationService } from '../services/NotificationService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationRecord | null;
}

export function NotificationViewModal({ isOpen, onClose, notification }: Props) {
  const [stats, setStats] = useState({ read_count: 0, ack_count: 0 });

  useEffect(() => {
    if (isOpen && notification) {
      NotificationService.getNotificationStats(notification.id).then(setStats).catch(console.error);
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-kivon-card border border-kivon-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-kivon-border">
          <h2 className="text-xl font-medium text-white flex items-center gap-2">
            Detalhes da Notificação
            <span className="px-2 py-0.5 rounded text-xs font-medium border bg-kivon-bg/50 border-kivon-border text-kivon-text-sec">
              {notification.status}
            </span>
          </h2>
          <button onClick={onClose} className="text-kivon-text-sec hover:text-white transition-colors p-2 -mr-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{notification.title}</h3>
                <div className="p-4 bg-kivon-bg/50 rounded-lg border border-kivon-border text-white whitespace-pre-wrap">
                  {notification.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-kivon-bg/50 rounded-lg border border-kivon-border">
                  <div className="text-xs text-kivon-text-sec mb-1">Estatísticas de Leitura</div>
                  <div className="text-2xl font-semibold text-white">{stats.read_count} <span className="text-sm font-normal text-kivon-text-sec">leituras</span></div>
                </div>
                {notification.requires_acknowledgment && (
                  <div className="p-4 bg-kivon-bg/50 rounded-lg border border-kivon-border">
                    <div className="text-xs text-kivon-text-sec mb-1">Estatísticas de Ciência</div>
                    <div className="text-2xl font-semibold text-white">{stats.ack_count} <span className="text-sm font-normal text-kivon-text-sec">confirmações</span></div>
                  </div>
                )}
              </div>

              {Object.keys(notification.metadata || {}).length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Metadados (JSON)</h4>
                  <pre className="p-4 bg-black/50 rounded-lg border border-kivon-border text-kivon-text-sec font-mono text-xs overflow-x-auto">
                    {JSON.stringify(notification.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="space-y-4">
              <div className="p-4 bg-kivon-bg/30 rounded-lg border border-kivon-border space-y-4">
                
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Classificação</div>
                    <div className="font-medium text-white">{notification.type} • {notification.priority}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Público Alvo</div>
                    <div className="font-medium text-white">{notification.target_type}</div>
                    {notification.target_id && <div className="text-xs text-kivon-text-sec truncate max-w-[200px]" title={notification.target_id}>{notification.target_id}</div>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Origem</div>
                    <div className="font-medium text-white uppercase">{notification.source}</div>
                  </div>
                </div>

              </div>

              <div className="p-4 bg-kivon-bg/30 rounded-lg border border-kivon-border space-y-4">
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Publicação</div>
                    <div className="text-sm text-white">
                      {notification.publish_at ? format(parseISO(notification.publish_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Não agendado'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Expiração</div>
                    <div className="text-sm text-white">
                      {notification.expires_at ? format(parseISO(notification.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Sem expiração'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-kivon-text-sec shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-kivon-text-sec">Criação & Atualização</div>
                    <div className="text-xs text-white mt-1">
                      <div>Criado: {format(parseISO(notification.created_at), "dd/MM/yy HH:mm")}</div>
                      <div>Atualizado: {format(parseISO(notification.updated_at), "dd/MM/yy HH:mm")}</div>
                      <div className="truncate max-w-[200px]" title={notification.creator_name || notification.created_by || ''}>Por: {notification.creator_name || 'Sistema'}</div>
                    </div>
                  </div>
                </div>

                {notification.resolved_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-kivon-text-sec">Resolução</div>
                      <div className="text-xs text-white mt-1">
                        <div>Data: {format(parseISO(notification.resolved_at), "dd/MM/yy HH:mm")}</div>
                        <div className="truncate max-w-[200px]" title={notification.resolver_name || notification.resolved_by || ''}>Por: {notification.resolver_name || 'Sistema'}</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-kivon-border bg-kivon-bg/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-kivon-card border border-kivon-border rounded-md hover:bg-kivon-hover transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
