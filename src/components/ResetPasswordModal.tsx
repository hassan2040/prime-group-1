import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Shield, AlertTriangle, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ResetPasswordModalProps {
  employee: User;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ employee, onClose }) => {
  const { addAuditLog } = useAppContext();
  const { user: currentUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await sendPasswordResetEmail(auth, employee.email);
      setMessage({ type: 'success', text: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد الموظف بنجاح' });
      addAuditLog(currentUser.id, currentUser.name, `أرسل رابط إعادة تعيين كلمة مرور للموظف: ${employee.name}`);
      setTimeout(onClose, 3000);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      setMessage({ type: 'error', text: 'فشل إرسال البريد الإلكتروني. تأكد من صحة البريد المسجل.' });
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
              سيتم إرسال رابط آمن إلى البريد الإلكتروني الخاص بالموظف <strong>{employee.name}</strong> ({employee.email}) لإعادة تعيين كلمة المرور الخاصة به.
            </p>
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
              disabled={isSubmitting}
              className="flex-[2] bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط التعيين'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
