import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type} animate-toast-in`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle2 size={16} strokeWidth={2.2} />}
            {toast.type === 'warning' && <AlertTriangle size={16} strokeWidth={2.2} />}
            {toast.type === 'danger' && <AlertCircle size={16} strokeWidth={2.2} />}
            {toast.type === 'info' && <CheckCircle2 size={16} strokeWidth={2.2} />}
          </div>
          <span className="toast-text">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            title="Fechar"
            aria-label="Fechar notificação"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
};
