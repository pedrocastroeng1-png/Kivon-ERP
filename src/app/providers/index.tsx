import React from 'react';
import { AuthProvider } from './AuthProvider';
import { NotificationRealtimeProvider } from '@/src/features/smart-center/providers/NotificationRealtimeProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationRealtimeProvider>
        {children}
      </NotificationRealtimeProvider>
    </AuthProvider>
  );
}
