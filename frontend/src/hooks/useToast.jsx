import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500/20 border-green-500/50 text-green-300',
    error: 'bg-red-500/20 border-red-500/50 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  }[type] || 'bg-blue-500/20 border-blue-500/50 text-blue-300';

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg border ${bgColor} flex items-center justify-between max-w-md animate-slide-in`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (payload, type = 'success', duration = 3000) => {
    let message = '';
    let toastType = type;
    let toastDuration = duration;

    if (typeof payload === 'string') {
      message = payload;
    } else if (payload && typeof payload === 'object') {
      message = payload.message || payload.description || payload.title || '';
      toastType = payload.type || toastType;
      toastDuration = payload.duration || toastDuration;
    }

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type: toastType, duration: toastDuration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = showToast;
  toast.toasts = toasts;
  toast.showToast = showToast;
  toast.removeToast = removeToast;

  return toast;
};

export default useToast;
