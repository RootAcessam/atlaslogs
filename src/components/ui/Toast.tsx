import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 5000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-400" size={20} />,
    error: <XCircle className="text-[#E11D48]" size={20} />,
    info: <AlertCircle className="text-blue-400" size={20} />,
  };

  const bgColors = {
    success: 'bg-green-900/30 border-green-800',
    error: 'bg-[#E11D48]/20 border-[#E11D48]/50',
    info: 'bg-blue-900/30 border-blue-800',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[type]} shadow-lg backdrop-blur-sm animate-slideIn`}
    >
      {icons[type]}
      <p className="text-white text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }: { toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
