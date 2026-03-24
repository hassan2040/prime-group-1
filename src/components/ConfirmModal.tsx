import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-500 shadow-red-900/20',
    warning: 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20',
    info: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
  };

  const iconColors = {
    danger: 'text-red-500 bg-red-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[type]}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <div className="p-8">
          <p className="text-zinc-400 leading-relaxed">{message}</p>
        </div>

        <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-[2] text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${colors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
