import React from 'react';
import { NotificationRecord } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Copy, Archive, CheckCircle, Trash2, Eye, AlertTriangle, Info, ShieldAlert, MessageSquare } from 'lucide-react';

interface Props {
  notifications: NotificationRecord[];
  onView: (n: NotificationRecord) => void;
  onEdit: (n: NotificationRecord) => void;
  onDuplicate: (n: NotificationRecord) => void;
  onResolve: (id: string) => void;
  onArchive: (n: NotificationRecord) => void;
  onDelete: (id: string) => void;
}

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'CRITICAL': return <ShieldAlert className="h-5 w-5 text-red-500" />;
    case 'HIGH': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'MEDIUM': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'INFO': return <Info className="h-5 w-5 text-blue-500" />;
    default: return null;
  }
};

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    ALERT: 'bg-red-500/10 text-red-500 border-red-500/20',
    COMMUNICATION: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    UPDATE: 'bg-green-500/10 text-green-500 border-green-500/20',
    SYSTEM: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
      {type}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    PUBLISHED: 'bg-green-500/10 text-green-500 border-green-500/20',
    DRAFT: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    CANCELED: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
      {status}
    </span>
  );
};

export function NotificationTable({ notifications, onView, onEdit, onDuplicate, onResolve, onArchive, onDelete }: Props) {
  return (
    <div className="bg-kivon-card border border-kivon-border rounded-lg overflow-hidden flex-1 shadow-sm">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-kivon-text-sec uppercase bg-kivon-hover border-b border-kivon-border">
            <tr>
              <th className="px-4 py-3 font-medium text-center w-16">Prio</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Alvo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Publicação</th>
              <th className="px-4 py-3 font-medium">Expiração</th>
              <th className="px-4 py-3 font-medium">Criado por</th>
              <th className="px-4 py-3 font-medium text-right w-40">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kivon-border">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-kivon-hover/50 transition-colors">
                <td className="px-4 py-3 flex justify-center items-center">
                  <div title={n.priority}><PriorityIcon priority={n.priority} /></div>
                </td>
                <td className="px-4 py-3"><TypeBadge type={n.type} /></td>
                <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={n.title}>
                  {n.title}
                </td>
                <td className="px-4 py-3 text-kivon-text-sec uppercase text-xs">{n.source}</td>
                <td className="px-4 py-3 text-kivon-text-sec">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{n.target_type}</span>
                    {n.target_type !== 'GLOBAL' && n.target_id && (
                      <span className="text-[10px] opacity-70 truncate max-w-[100px]" title={n.target_id}>{n.target_id}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                <td className="px-4 py-3 text-kivon-text-sec text-xs">
                  {n.publish_at ? format(parseISO(n.publish_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                </td>
                <td className="px-4 py-3 text-kivon-text-sec text-xs">
                  {n.expires_at ? format(parseISO(n.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                </td>
                <td className="px-4 py-3 text-kivon-text-sec text-xs truncate max-w-[100px]" title={n.creator_name}>
                  {n.creator_name || '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onView(n)} className="p-1.5 text-kivon-text-sec hover:text-white rounded hover:bg-kivon-bg transition-colors" title="Visualizar Detalhes">
                      <Eye className="h-4 w-4" />
                    </button>
                    {n.status === 'DRAFT' && (
                      <button onClick={() => onEdit(n)} className="p-1.5 text-kivon-text-sec hover:text-white rounded hover:bg-kivon-bg transition-colors" title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => onDuplicate(n)} className="p-1.5 text-kivon-text-sec hover:text-white rounded hover:bg-kivon-bg transition-colors" title="Duplicar">
                      <Copy className="h-4 w-4" />
                    </button>
                    {n.status === 'PUBLISHED' && !n.resolved_at && (
                      <button onClick={() => onResolve(n.id)} className="p-1.5 text-kivon-text-sec hover:text-green-400 rounded hover:bg-kivon-bg transition-colors" title="Resolver">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {n.status !== 'ARCHIVED' && (
                      <button onClick={() => onArchive(n)} className="p-1.5 text-kivon-text-sec hover:text-yellow-400 rounded hover:bg-kivon-bg transition-colors" title="Arquivar">
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => onDelete(n.id)} className="p-1.5 text-kivon-text-sec hover:text-red-400 rounded hover:bg-kivon-bg transition-colors" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-kivon-text-sec">
                  Nenhuma notificação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
