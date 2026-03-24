import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleModal } from '../components/RoleModal';
import { Role } from '../types';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const RolesPage: React.FC = () => {
  const { db: appData, addAuditLog, showToast } = useAppContext();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  if (!appData || !user) return null;

  const roles = appData.roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDeleteRole = async (id: string) => {
    const roleToDelete = appData.roles.find(r => r.id === id);
    if (!roleToDelete) return;

    // Check if any employee is using this role
    const isUsed = appData.users.some(u => u.roleId === id);
    if (isUsed) {
      showToast('لا يمكن حذف هذا المسمى الوظيفي لأنه مرتبط بموظفين حاليين', 'error');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف المسمى الوظيفي "${roleToDelete.name}"؟`)) return;
    
    setIsDeleting(id);
    const path = `roles/${id}`;
    try {
      await deleteDoc(doc(db, 'roles', id));
      addAuditLog(user.id, user.name, `حذف المسمى الوظيفي: ${roleToDelete.name}`);
      showToast('تم حذف المسمى الوظيفي بنجاح');
    } catch (error) {
      console.error('Error deleting role:', error);
      handleFirestoreError(error, OperationType.DELETE, path);
      showToast('فشل حذف المسمى الوظيفي', 'error');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">المسميات الوظيفية</h1>
          <p className="text-zinc-500">إدارة الهيكل الإداري والمسميات الوظيفية للمؤسسة.</p>
        </div>
        <button 
          onClick={() => {
            setEditingRole(undefined);
            setIsModalOpen(true);
          }}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مسمى جديد</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="البحث في المسميات..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-white/5 text-zinc-400 text-sm">
              <th className="px-6 py-4 font-bold">المسمى الوظيفي</th>
              <th className="px-6 py-4 font-bold">عدد الموظفين</th>
              <th className="px-6 py-4 font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {roles.map(role => {
              const count = appData.users.filter(u => u.roleId === role.id).length;
              return (
                <tr key={role.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-zinc-500" />
                      </div>
                      <span className="font-bold">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold">{count} موظف</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingRole(role);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-primary-light text-zinc-500 hover:text-primary transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={isDeleting === role.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 className={`w-4 h-4 ${isDeleting === role.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {roles.map(role => {
          const count = appData.users.filter(u => u.roleId === role.id).length;
          return (
            <div key={role.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-zinc-500" />
                  </div>
                  <span className="font-bold">{role.name}</span>
                </div>
                <span className="px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold">{count} موظف</span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={() => {
                    setEditingRole(role);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-light text-primary text-sm font-bold"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </button>
                <button 
                  onClick={() => handleDeleteRole(role.id)}
                  disabled={isDeleting === role.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold disabled:opacity-50"
                >
                  <Trash2 className={`w-4 h-4 ${isDeleting === role.id ? 'animate-spin' : ''}`} />
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <RoleModal 
            role={editingRole} 
            onClose={() => {
              setIsModalOpen(false);
              setEditingRole(undefined);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
