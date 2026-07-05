import React from 'react';
import { cn } from '@/src/shared/lib/utils';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationType } from '../types';

export function NotificationFilters() {
  const { activeFilter, setActiveFilter } = useNotificationStore();

  return (
    <div className="px-6 py-3 border-b border-kivon-border flex gap-2 overflow-x-auto scrollbar-hide">
      <FilterBadge active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')}>
        Todas
      </FilterBadge>
      <FilterBadge active={activeFilter === 'UNREAD'} onClick={() => setActiveFilter('UNREAD')}>
        Não lidas
      </FilterBadge>
      <FilterBadge active={activeFilter === 'ALERT'} onClick={() => setActiveFilter('ALERT')}>
        Alertas
      </FilterBadge>
      <FilterBadge active={activeFilter === 'COMMUNICATION'} onClick={() => setActiveFilter('COMMUNICATION')}>
        Comunicados
      </FilterBadge>
      <FilterBadge active={activeFilter === 'UPDATE'} onClick={() => setActiveFilter('UPDATE')}>
        Atualizações
      </FilterBadge>
      <FilterBadge active={activeFilter === 'SYSTEM'} onClick={() => setActiveFilter('SYSTEM')}>
        Sistema
      </FilterBadge>
    </div>
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
