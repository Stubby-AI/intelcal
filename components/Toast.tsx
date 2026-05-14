import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface ToastProps {
  message?: string;
  type?: 'success' | 'error';
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message || !type) {
    return null;
  }

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const icon = isSuccess 
    ? <CheckCircleIcon className="w-6 h-6 text-white" /> 
    : <XCircleIcon className="w-6 h-6 text-white" />;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 w-auto max-w-sm p-4 rounded-lg shadow-lg text-white ${bgColor} animate-fade-in-down`}
      role="alert"
    >
      {icon}
      <span className="text-sm font-medium">{message}</span>
      <style>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
