import { create } from 'zustand';
import { NotificationType } from '../types';

interface NotificationState {
  isOpen: boolean;
  activeFilter: 'ALL' | 'UNREAD' | NotificationType;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setActiveFilter: (filter: 'ALL' | 'UNREAD' | NotificationType) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  isOpen: false,
  activeFilter: 'ALL',
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
