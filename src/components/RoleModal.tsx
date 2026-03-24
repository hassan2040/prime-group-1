import React, { useState, useEffect } from 'react';
import { X, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface RoleModalProps {
  onClose: () => void;
  role?: Role;
}

export const RoleModal: React.FC<RoleModalProps> = ({ onClose, role }) => {
  const { db, updateDB, addAuditLog } = useAppContext();
  const { user } = useAuth();
  const [name, setName] = useState(role?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const newDB = { ...db };
      if (role) {
        // Edit existing role
        newDB.roles = newDB.roles.map(r => r.id === role.id ? { ...r, name: name.trim() } : r);
        addAuditLog(user.id, user.name, `تعديل المسمى الوظيفي: ${role.name} إلى ${name.trim()}`);
      } else {
        // Add new role
        const newRole: Role = {
          id: Math.random().toString(36).substr(2, 9),
          name: name.trim()
        };
        newDB.roles = [...newDB.roles, newRole];
        addAuditLog(user.id, user.name, `إضافة مسمى وظيفي جديد: ${name.trim()}`);
      }

      await updateDB(newDB);
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{role ? 'تعديل مسمى وظيفي' : 'إضافة مسمى وظيفي جديد'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 mr-1">اسم المسمى الوظيفي</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مدير مبيعات، مهندس إنتاج..."
              className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-[2] bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary transition-all active:scale-95"
            >
              {isSubmitting ? 'جاري الحفظ...' : (role ? 'حفظ التعديلات' : 'إضافة المسمى')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
