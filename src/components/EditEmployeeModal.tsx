import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, User as UserIcon, Shield, Briefcase, Mail, Lock, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface EditEmployeeModalProps {
  employee: User;
  onClose: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ employee, onClose }) => {
  const { db: appData, addAuditLog, showToast } = useAppContext();
  const { user: currentUser } = useAuth();
  
  const [name, setName] = useState(employee.name);
  const [username, setUsername] = useState(employee.username);
  const [roleId, setRoleId] = useState(employee.roleId);
  const [departmentId, setDepartmentId] = useState(employee.departmentId || '');
  const [managerId, setManagerId] = useState(employee.managerId || '');
  const [status, setStatus] = useState(employee.status);
  const [permissions, setPermissions] = useState<string[]>(employee.permissions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appData || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const userRef = doc(db, 'users', employee.id);
      await updateDoc(userRef, {
        name,
        username,
        roleId,
        departmentId,
        managerId: managerId || null,
        status,
        permissions
      });
      
      addAuditLog(currentUser.id, currentUser.name, `عدل بيانات الموظف: ${name}`);
      showToast(`تم تحديث بيانات الموظف ${name} بنجاح`);
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('فشل في تحديث بيانات الموظف', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter(p => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const availablePermissions = [
    { id: 'create_tasks', label: 'إنشاء المهام' },
    { id: 'manage_employees', label: 'إدارة الموظفين' },
    { id: 'manage_announcements', label: 'إدارة الإعلانات' },
    { id: 'manage_permissions', label: 'إدارة الصلاحيات' },
    { id: 'manage_settings', label: 'إدارة الإعدادات' },
    { id: 'full_control', label: 'تحكم كامل' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">تعديل بيانات الموظف</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">المسمى الوظيفي</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {appData.roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">القسم / الإدارة</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">اختر القسم (اختياري)</option>
                  {(() => {
                    const renderOptions = (parentId: string | undefined = undefined, level: number = 0, visited = new Set<string>()): React.ReactNode[] => {
                      const depts = appData.departments.filter(d => (d.parentId || undefined) === (parentId || undefined));
                      return depts.flatMap(dept => {
                        if (visited.has(dept.id)) return [];
                        visited.add(dept.id);
                        
                        return [
                          <option key={dept.id} value={dept.id}>
                            {'\u00A0'.repeat(level * 4)}{level > 0 ? '↳ ' : ''}{dept.name}
                          </option>,
                          ...renderOptions(dept.id, level + 1, visited)
                        ];
                      });
                    };
                    return renderOptions();
                  })()}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">المدير المباشر</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">بدون مدير (اختياري)</option>
                  {appData.users.filter(u => u.id !== employee.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">حالة الموظف</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${status === 'active' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    نشط
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${status === 'inactive' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    غير نشط
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm text-zinc-400 mr-1">الصلاحيات</label>
              <div className="grid grid-cols-1 gap-2">
                {availablePermissions.map(perm => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      permissions.includes(perm.id) 
                        ? 'bg-primary-light border-primary/30 text-primary' 
                        : 'bg-zinc-800/30 border-white/5 text-zinc-500 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-bold">{perm.label}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      permissions.includes(perm.id) ? 'bg-primary border-primary' : 'border-zinc-700'
                    }`}>
                      {permissions.includes(perm.id) && <X className="w-3 h-3 text-white rotate-45" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={!name || !username || !roleId || isSubmitting}
              className="px-12 py-4 bg-white text-zinc-900 font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
