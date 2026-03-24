import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, User as UserIcon, Shield, Briefcase, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface AddEmployeeModalProps {
  onClose: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onClose }) => {
  const { db, updateDB, addAuditLog, showToast } = useAppContext();
  const { user: currentUser } = useAuth();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  if (!db || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Default password is '123456'
    // The server will hash it on first login if we send it as plain text, 
    // or we can hash it here if we had a hashing function available.
    // Since server.ts handles plain text migration, we can send '123456'.
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      password: '123456',
      name,
      roleId,
      departmentId,
      permissions,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: null
    };

    const newDB = { ...db, users: [...db.users, newUser] };
    await updateDB(newDB);
    addAuditLog(currentUser.id, currentUser.name, `أضاف موظفاً جديداً: ${name}`);
    showToast(`تم إضافة الموظف ${name} بنجاح`);
    
    onClose();
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
          <h2 className="text-xl font-bold">إضافة موظف جديد</h2>
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
                  placeholder="الاسم الثلاثي"
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
                  placeholder="username"
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
                  <option value="">اختر المسمى الوظيفي</option>
                  {db.roles.map(role => (
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
                  {db.departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-primary-light border border-primary/10 rounded-2xl">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold">كلمة المرور الافتراضية</span>
                </div>
                <p className="text-[10px] text-zinc-500">سيتم تعيين كلمة المرور الافتراضية (123456) لهذا الموظف. يمكنه تغييرها لاحقاً من ملفه الشخصي.</p>
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
              disabled={!name || !username || !roleId}
              className="px-12 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              إضافة الموظف
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
