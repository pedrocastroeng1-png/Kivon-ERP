import React from 'react';
import { NotificationStats as Stats } from '../types';
import { Bell, Archive, FileEdit, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface Props {
  stats: Stats | null;
}

export function NotificationStats({ stats }: Props) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-kivon-card rounded-lg border border-kivon-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-kivon-text-sec">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="h-10 w-10 bg-kivon-primary/10 rounded-full flex items-center justify-center">
          <Bell className="h-5 w-5 text-kivon-primary" />
        </div>
      </div>
      
      <div className="bg-kivon-card rounded-lg border border-kivon-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-kivon-text-sec">Publicadas</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.published}</p>
        </div>
        <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        </div>
      </div>
      
      <div className="bg-kivon-card rounded-lg border border-kivon-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-kivon-text-sec">Rascunhos</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.drafts}</p>
        </div>
        <div className="h-10 w-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
          <FileEdit className="h-5 w-5 text-yellow-400" />
        </div>
      </div>
      
      <div className="bg-kivon-card rounded-lg border border-kivon-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-kivon-text-sec">Críticos (Publ.)</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats.critical}</p>
        </div>
        <div className="h-10 w-10 bg-red-500/10 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
      </div>
      
      <div className="bg-kivon-card rounded-lg border border-kivon-border p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-kivon-text-sec">Arquivadas</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{stats.archived}</p>
        </div>
        <div className="h-10 w-10 bg-gray-500/10 rounded-full flex items-center justify-center">
          <Archive className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
