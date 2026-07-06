import React, { useState, useEffect } from 'react';
import { NotificationRecord, NotificationType, NotificationPriority, NotificationTargetType, NotificationSource } from '../types';
import { X, Save, Send } from 'lucide-react';
import { supabase } from '@/src/shared/lib/supabase';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<NotificationRecord>) => Promise<boolean>;
  initialData?: NotificationRecord | null;
}

export function NotificationModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<NotificationRecord>>({
    type: 'COMMUNICATION',
    priority: 'INFO',
    source: 'system',
    target_type: 'GLOBAL',
    target_id: '',
    title: '',
    description: '',
    metadata: {},
    requires_acknowledgment: false,
    is_pinned: false,
    publish_at: new Date().toISOString().slice(0, 16),
    expires_at: '',
  });

  const [metadataStr, setMetadataStr] = useState('{}');
  
  // Data for target selectors
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          publish_at: initialData.publish_at ? new Date(initialData.publish_at).toISOString().slice(0, 16) : '',
          expires_at: initialData.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : '',
        });
        setMetadataStr(JSON.stringify(initialData.metadata || {}, null, 2));
      } else {
        setFormData({
          type: 'COMMUNICATION',
          priority: 'INFO',
          source: 'system',
          target_type: 'GLOBAL',
          target_id: '',
          title: '',
          description: '',
          requires_acknowledgment: false,
          is_pinned: false,
          publish_at: new Date().toISOString().slice(0, 16),
          expires_at: '',
        });
        setMetadataStr('{}');
      }
    }
  }, [isOpen, initialData]);

  // Load target options when needed
  useEffect(() => {
    if (!isOpen) return;
    
    if (formData.target_type === 'USER' && users.length === 0) {
      supabase.from('users').select('id, full_name').eq('active', true).order('full_name')
        .then(({ data }) => setUsers((data || []).map(u => ({ id: u.id, name: u.full_name }))));
    }
    if (formData.target_type === 'PROJECT' && projects.length === 0) {
      supabase.from('projects').select('id, name').eq('active', true).order('name')
        .then(({ data }) => setProjects((data || []).map(p => ({ id: p.id, name: p.name }))));
    }
    if (formData.target_type === 'ROLE' && roles.length === 0) {
      supabase.from('profiles').select('id, name').order('name')
        .then(({ data }) => setRoles((data || []).map(r => ({ id: r.id, name: r.name }))));
    }
  }, [isOpen, formData.target_type]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMetadataStr(e.target.value);
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    try {
      setLoading(true);
      let parsedMetadata = {};
      if (metadataStr.trim()) {
        parsedMetadata = JSON.parse(metadataStr);
      }

      const payload = {
        ...formData,
        metadata: parsedMetadata,
        status,
        publish_at: formData.publish_at ? new Date(formData.publish_at).toISOString() : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        target_id: formData.target_type === 'GLOBAL' ? null : formData.target_id,
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      toast.error('Erro no JSON Metadata: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-kivon-card border border-kivon-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-kivon-border">
          <h2 className="text-xl font-medium text-white">
            {initialData ? 'Editar Notificação' : 'Nova Notificação'}
          </h2>
          <button onClick={onClose} className="text-kivon-text-sec hover:text-white transition-colors p-2 -mr-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Core Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-kivon-text-sec mb-1">Título *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white placeholder-kivon-text-sec focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-kivon-text-sec mb-1">Descrição *</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white placeholder-kivon-text-sec focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-kivon-text-sec mb-1">Tipo</label>
                  <select
                    name="type"
                    value={formData.type || 'COMMUNICATION'}
                    onChange={handleChange}
                    className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                  >
                    <option value="ALERT">Alert</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="UPDATE">Update</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-kivon-text-sec mb-1">Prioridade</label>
                  <select
                    name="priority"
                    value={formData.priority || 'INFO'}
                    onChange={handleChange}
                    className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="INFO">Info</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-kivon-text-sec mb-1">Origem</label>
                  <select
                    name="source"
                    value={formData.source || 'system'}
                    onChange={handleChange}
                    className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                  >
                    <option value="system">System</option>
                    <option value="manual">Manual</option>
                    <option value="presence">Presence</option>
                    <option value="employees">Employees</option>
                    <option value="projects">Projects</option>
                    <option value="update">Update</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Targeting & Time */}
            <div className="space-y-4">
              <div className="bg-kivon-bg/50 p-4 rounded-lg border border-kivon-border space-y-4">
                <h3 className="font-medium text-white border-b border-kivon-border pb-2">Público Alvo</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-kivon-text-sec mb-1">Tipo de Alvo</label>
                    <select
                      name="target_type"
                      value={formData.target_type || 'GLOBAL'}
                      onChange={handleChange}
                      className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                    >
                      <option value="GLOBAL">Global (Todos)</option>
                      <option value="ROLE">Cargo / Perfil</option>
                      <option value="PROJECT">Obra / Projeto</option>
                      <option value="USER">Usuário Específico</option>
                    </select>
                  </div>

                  {formData.target_type !== 'GLOBAL' && (
                    <div>
                      <label className="block text-sm font-medium text-kivon-text-sec mb-1">
                        {formData.target_type === 'USER' ? 'Selecionar Usuário' : 
                         formData.target_type === 'PROJECT' ? 'Selecionar Obra' : 'Selecionar Perfil'}
                      </label>
                      <select
                        name="target_id"
                        value={formData.target_id || ''}
                        onChange={handleChange}
                        required={formData.target_type !== 'GLOBAL'}
                        className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                      >
                        <option value="">Selecione...</option>
                        {formData.target_type === 'USER' && users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        {formData.target_type === 'PROJECT' && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        {formData.target_type === 'ROLE' && roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-kivon-bg/50 p-4 rounded-lg border border-kivon-border space-y-4">
                <h3 className="font-medium text-white border-b border-kivon-border pb-2">Agendamento & Configurações</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-kivon-text-sec mb-1">Publicar em</label>
                    <input
                      type="datetime-local"
                      name="publish_at"
                      value={formData.publish_at || ''}
                      onChange={handleChange}
                      className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-kivon-text-sec mb-1">Expirar em (opcional)</label>
                    <input
                      type="datetime-local"
                      name="expires_at"
                      value={formData.expires_at || ''}
                      onChange={handleChange}
                      className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="is_pinned"
                      checked={formData.is_pinned || false}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-kivon-border bg-kivon-bg text-kivon-primary focus:ring-kivon-primary focus:ring-offset-kivon-card"
                    />
                    <span className="text-white group-hover:text-kivon-primary transition-colors">Fixar no topo (Pinned)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="requires_acknowledgment"
                      checked={formData.requires_acknowledgment || false}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-kivon-border bg-kivon-bg text-kivon-primary focus:ring-kivon-primary focus:ring-offset-kivon-card"
                    />
                    <span className="text-white group-hover:text-kivon-primary transition-colors">Exigir reconhecimento de leitura (Ciente)</span>
                  </label>
                </div>
              </div>

              <div>
                <details className="group">
                  <summary className="text-sm font-medium text-kivon-primary cursor-pointer hover:underline mb-2">
                    Avançado: Metadata (JSON)
                  </summary>
                  <textarea
                    value={metadataStr}
                    onChange={handleMetadataChange}
                    rows={4}
                    className="w-full rounded-md bg-kivon-bg border border-kivon-border px-3 py-2 text-white font-mono text-xs focus:border-kivon-primary focus:ring-1 focus:ring-kivon-primary resize-none"
                    placeholder="{}"
                  />
                </details>
              </div>

            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-kivon-border bg-kivon-bg/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-transparent border border-kivon-border rounded-md hover:bg-kivon-hover transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-md hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={loading || !formData.title || !formData.description}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-kivon-primary rounded-md hover:bg-kivon-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Publicar
          </button>
        </div>

      </div>
    </div>
  );
}
