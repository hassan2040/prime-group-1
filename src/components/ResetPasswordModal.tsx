import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface ResetPasswordModalProps {
  employee: User;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ employee, onClose }) => {
  const { addAuditLog } = useAppContext();
  const { user: currentUser } = useAuth();
  
  const [newPassword, setNewPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: employee.id,
          newPassword
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم إعادة تعيين كلمة المرور بنجاح' });
        addAuditLog(currentUser.id, currentUser.name, `أعاد تعيين كلمة مرور الموظف: ${employee.name}`);
        setTimeout(onClose, 2000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'فشل إعادة تعيين كلمة المرور' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">إعادة تعيين كلمة المرور</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-200 leading-relaxed">
              أنت على وشك تغيير كلمة مرور الموظف <strong>{employee.name}</strong>. 
              يرجى تزويده بكلمة المرور الجديدة بعد الحفظ.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 mr-1">كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono"
                required
              />
            </div>
          </div>

          {message && (
            <p className={`text-center text-sm font-bold ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !newPassword}
              className="flex-[2] bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد التغيير'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
