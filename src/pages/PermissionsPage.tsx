import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Search, 
  Check, 
  X, 
  Save,
  RotateCcw,
  User as UserIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { Permission, User } from '../types';
import { db as firestore } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const PermissionsPage: React.FC = () => {
  const { db: appData, addAuditLog } = useAppContext();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!appData || !currentUser) return null;

  const users = appData.users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedUser = appData.users.find(u => u.id === selectedUserId);

  const permissions: { id: Permission; label: string; desc: string }[] = [
    { id: 'full_control', label: 'التحكم الكامل', desc: 'جميع الصلاحيات معاً' },
    { id: 'create_tasks', label: 'إنشاء مهام', desc: 'إمكانية إنشاء مهام جديدة' },
    { id: 'edit_tasks', label: 'تعديل مهام', desc: 'تعديل المهام الموجودة' },
    { id: 'delete_tasks', label: 'حذف مهام', desc: 'حذف المهام نهائياً' },
    { id: 'create_announcements', label: 'إنشاء إعلانات', desc: 'نشر إعلانات وقرارات جديدة' },
    { id: 'edit_announcements', label: 'تعديل إعلانات', desc: 'تعديل الإعلانات المنشورة' },
    { id: 'delete_announcements', label: 'حذف إعلانات', desc: 'حذف الإعلانات' },
    { id: 'manage_employees', label: 'إدارة الموظفين', desc: 'إضافة وتعديل وحذف الموظفين' },
    { id: 'manage_permissions', label: 'إدارة الصلاحيات', desc: 'تحديد صلاحيات الموظفين الآخرين' },
    { id: 'manage_settings', label: 'إدارة الإعدادات', desc: 'التحكم في إعدادات الشركة' },
    { id: 'view_performance', label: 'مشاهدة الأداء', desc: 'رؤية إحصائيات جميع الموظفين' },
    { id: 'view_all_tasks', label: 'عرض جميع المهام', desc: 'رؤية كافة المهام بغض النظر عن التكليف' },
    { id: 'view_only', label: 'مشاهدة فقط', desc: 'قراءة البيانات فقط بدون إمكانية التعديل' },
  ];

  const handleTogglePermission = async (perm: Permission) => {
    if (!selectedUser) return;
    
    try {
      const userPerms = [...selectedUser.permissions];
      let newPerms;
      
      if (userPerms.includes(perm)) {
        newPerms = userPerms.filter(p => p !== perm);
      } else {
        newPerms = [...userPerms, perm];
      }
      
      await updateDoc(doc(firestore, 'users', selectedUser.id), {
        permissions: newPerms
      });
      
      addAuditLog(currentUser.id, currentUser.name, `تعديل صلاحيات الموظف: ${selectedUser.name}`);
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleSetAll = async (enable: boolean) => {
    if (!selectedUser) return;
    try {
      const newPerms = enable ? permissions.map(p => p.id) : [];
      await updateDoc(doc(firestore, 'users', selectedUser.id), {
        permissions: newPerms
      });
      addAuditLog(currentUser.id, currentUser.name, `${enable ? 'تفعيل' : 'سحب'} جميع صلاحيات الموظف: ${selectedUser.name}`);
    } catch (error) {
      console.error('Error setting all permissions:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">إدارة الصلاحيات</h1>
        <p className="text-zinc-500">تخصيص صلاحيات الوصول لكل موظف بشكل مستقل.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Users List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="بحث عن موظف..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 text-white pr-10 pl-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-center gap-3 p-4 border-b border-white/5 transition-all text-right ${
                  selectedUserId === u.id ? 'bg-primary-light border-r-4 border-r-primary' : 'hover:bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {u.avatar ? <img src={u.avatar} alt="" /> : <UserIcon className="w-5 h-5 text-zinc-600" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{appData.roles.find(r => r.id === u.roleId)?.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">صلاحيات {selectedUser.name}</h2>
                    <p className="text-zinc-500 text-xs">قم بتفعيل أو إلغاء الصلاحيات المطلوبة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSetAll(true)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all">تفعيل الكل</button>
                  <button onClick={() => handleSetAll(false)} className="px-4 py-2 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all">سحب الكل</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.map(perm => {
                  const isActive = selectedUser.permissions.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-right ${
                        isActive 
                          ? 'bg-primary-light border-primary/30' 
                          : 'bg-zinc-800/30 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-bold text-sm mb-1 ${isActive ? 'text-primary' : 'text-zinc-300'}`}>{perm.label}</p>
                        <p className="text-[10px] text-zinc-500">{perm.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isActive ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-700'
                      }`}>
                        {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="h-full bg-zinc-900/30 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-zinc-800 mb-4" />
              <p className="text-zinc-500">اختر موظفاً من القائمة لتعديل صلاحياته</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
