import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationStore } from '../store/notificationStore';

export function SmartCenterHeaderBadge() {
  const { unreadCount, unacknowledgedCount } = useNotifications();
  const { toggleOpen } = useNotificationStore();

  const totalActionable = unreadCount + unacknowledgedCount;

  return (
    <button 
      type="button" 
      onClick={toggleOpen} 
      className="p-2 text-kivon-text-sec hover:text-white transition-colors relative"
    >
      {totalActionable > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-kivon-primary ring-2 ring-kivon-bg text-[9px] font-bold text-black shadow-sm">
          {totalActionable > 99 ? '99+' : totalActionable}
        </span>
      )}
      <Bell className="h-5 w-5" />
    </button>
  );
}
