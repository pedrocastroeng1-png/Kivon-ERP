import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Plus, Edit2, Trash2, Loader2, Megaphone, PackageOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { SmartItemType, SmartItemPriority, SmartCenterItem } from '../types';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const schema = z.object({
  type: z.enum(['COMMUNICATION', 'UPDATE']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'INFO']),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().min(1, 'Mensagem é obrigatória'),
  valid_until: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function SmartCenterAdminPage() {
  const [items, setItems] = useState<SmartCenterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'COMMUNICATION', priority: 'INFO' }
  });

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smart_center_items')
        .select('*')
        .in('type', ['COMMUNICATION', 'UPDATE'])
        .order('created_at', { ascending: false });
        
      if (error) {
        console.warn("Table might not exist yet.", error);
        toast.error("Erro ao carregar comunicados. Verifique se a migração 0004 foi executada.");
      } else if (data) {
        setItems(data as SmartCenterItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openModal(item?: SmartCenterItem) {
    if (item) {
      setEditingId(item.id);
      reset({
        type: item.type as any,
        priority: item.priority as any,
        title: item.title,
        description: item.description,
        valid_until: item.valid_until ? item.valid_until.substring(0, 16) : ''
      });
    } else {
      setEditingId(null);
      reset({ type: 'COMMUNICATION', priority: 'INFO', title: '', description: '', valid_until: '' });
    }
    setIsModalOpen(true);
  }

  async function onSubmit(data: FormValues) {
    if (!user) return;
    
    const payload = {
      type: data.type,
      priority: data.priority,
      title: data.title,
      description: data.description,
      valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : null,
      created_by: user.id,
      active: true
    };
    
    try {
      if (editingId) {
        const { error } = await supabase.from('smart_center_items').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success("Item atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('smart_center_items').insert([payload]);
        if (error) throw error;
        toast.success("Item publicado com sucesso!");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }
  
  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja inativar este item?")) {
      try {
        const { error } = await supabase.from('smart_center_items').update({ active: false }).eq('id', id);
        if (error) throw error;
        toast.success("Item inativado!");
        fetchItems();
      } catch (err: any) {
        toast.error("Erro: " + err.message);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Central Inteligente</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie os comunicados e atualizações do sistema.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Comunicado
        </Button>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-kivon-text-sec">
            Nenhum item publicado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/50 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                  <th className="px-6 py-4 font-semibold">Título</th>
                  <th className="px-6 py-4 font-semibold">Prioridade</th>
                  <th className="px-6 py-4 font-semibold">Data Criação</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {items.map((item) => (
                  <tr key={item.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                      {item.type === 'COMMUNICATION' ? <Megaphone className="h-4 w-4 text-kivon-primary" /> : <PackageOpen className="h-4 w-4 text-blue-400" />}
                      {item.type === 'COMMUNICATION' ? 'Comunicado' : 'Atualização'}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{item.title}</td>
                    <td className="px-6 py-4">{item.priority}</td>
                    <td className="px-6 py-4">{format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${item.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {item.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(item)} className="p-1 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Item' : 'Novo Item'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Tipo</label>
              <select {...register('type')} className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all">
                <option value="COMMUNICATION">Comunicado</option>
                <option value="UPDATE">Atualização de Sistema</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Prioridade</label>
              <select {...register('priority')} className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all">
                <option value="INFO">Informativa (Info)</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          <Input label="Título" {...register('title')} error={errors.title?.message} className="bg-kivon-bg border-kivon-border text-white" />
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Mensagem</label>
            <textarea
              {...register('description')}
              rows={4}
              className="flex w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white placeholder:text-kivon-text-sec/50 focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all resize-none"
            />
            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
          </div>

          <Input label="Válido até (Opcional)" type="datetime-local" {...register('valid_until')} style={{ colorScheme: 'dark' }} className="bg-kivon-bg border-kivon-border text-white" />

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Salvar & Publicar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
