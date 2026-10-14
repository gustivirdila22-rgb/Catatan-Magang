import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-sm transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-[#344F3D] text-white border-[#263A2D]'
              : toast.type === 'error'
              ? 'bg-[#8F3B3B] text-white border-[#6F2B2B]'
              : 'bg-[#FFFFFF] text-[#26352C] border-[#E7E5DD]'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-[#879B83]" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-[#FFD1D1]" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 text-[#879B83]" />}

          <div className="flex-1 leading-snug">{toast.message}</div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current/60 hover:text-current transition-colors p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
