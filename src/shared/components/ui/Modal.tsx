import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center justify-center items-end overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm sm:p-4 p-0 animate-in fade-in duration-200">
      <div className={cn("relative w-full max-w-md bg-kivon-card border border-kivon-border shadow-2xl rounded-t-2xl sm:rounded-xl duration-200 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95", className)}>
        <div className="flex items-center justify-between border-b border-kivon-border p-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-kivon-text-sec hover:bg-kivon-hover hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 pb-12 sm:pb-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
