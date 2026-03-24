import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Edit2, 
  Trash2, 
  Key,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  X,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { EditEmployeeModal } from '../components/EditEmployeeModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { User, Department, Role } from '../types';
import { db } from '../firebase';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export const EmployeesPage: React.FC = () => {
  const { db: appData, addAuditLog, showToast } = useAppContext();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [selectedParentDeptId, setSelectedParentDeptId] = useState<string>('');
  
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [resettingPassword, setResettingPassword] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);

  if (!appData || !currentUser) return null;

  const employees = appData.users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesRole = roleFilter === 'all' || u.roleId === roleFilter;
    const matchesDept = deptFilter === 'all' || u.departmentId === deptFilter;
    
    return matchesSearch && matchesStatus && matchesRole && matchesDept;
  });

  const handleDeleteUser = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteDoc(doc(db, 'users', deletingEmployee.id));
      addAuditLog(currentUser.id, currentUser.name, `حذف الموظف: ${deletingEmployee.name}`);
      showToast(`تم حذف الموظف ${deletingEmployee.name} بنجاح`);
      setDeletingEmployee(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('فشل في حذف الموظف', 'error');
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    
    try {
      const deptId = Math.random().toString(36).substr(2, 9);
      const newDept: any = {
        id: deptId,
        name: newDeptName.trim(),
      };
      
      if (selectedParentDeptId) {
        newDept.parentId = selectedParentDeptId;
      }
      
      await setDoc(doc(db, 'departments', deptId), newDept);
      
      addAuditLog(currentUser.id, currentUser.name, `أضاف قسماً جديداً: ${newDeptName}`);
      showToast(`تم إضافة القسم ${newDeptName} بنجاح`);
      setNewDeptName('');
      setSelectedParentDeptId('');
    } catch (error) {
      console.error('Error adding department:', error);
      showToast('فشل في إضافة القسم', 'error');
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    // Check if any employee is in this department
    const isUsed = appData.users.some(u => u.departmentId === dept.id);
    if (isUsed) {
      showToast('لا يمكن حذف هذا القسم لأنه يحتوي على موظفين', 'error');
      return;
    }

    // Check if it has sub-departments
    const hasSubDepts = appData.departments.some(d => d.parentId === dept.id);
    if (hasSubDepts) {
      showToast('لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية', 'error');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف القسم "${dept.name}"؟`)) return;

    try {
      await deleteDoc(doc(db, 'departments', dept.id));
      addAuditLog(currentUser.id, currentUser.name, `حذف القسم: ${dept.name}`);
      showToast('تم حذف القسم بنجاح');
    } catch (error) {
      console.error('Error deleting department:', error);
      showToast('فشل في حذف القسم', 'error');
    }
  };

  const renderDeptHierarchy = (parentId: string | undefined = undefined, level: number = 0, visited = new Set<string>()) => {
    const depts = appData.departments.filter(d => (d.parentId || undefined) === (parentId || undefined));
    return depts.map(dept => {
      if (visited.has(dept.id)) return null;
      visited.add(dept.id);
      
      return (
        <React.Fragment key={dept.id}>
          <div 
            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
            style={{ marginRight: `${level * 24}px` }}
          >
            <div className="flex items-center gap-2">
              {level > 0 && <div className="w-4 h-px bg-zinc-700"></div>}
              <span className="font-bold">{dept.name}</span>
            </div>
            <button 
              onClick={() => handleDeleteDept(dept)}
              className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {renderDeptHierarchy(dept.id, level + 1, visited)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">إدارة الموظفين</h1>
          <p className="text-zinc-500">إضافة وتعديل بيانات الموظفين وتحديد صلاحياتهم.</p>
        </div>
        {(currentUser.permissions.includes('full_control') || currentUser.permissions.includes('manage_employees')) && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDeptModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Building className="w-5 h-5" />
              <span>إدارة الأقسام</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة موظف</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-[2] relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو اسم المستخدم..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex-1 grid grid-cols-3 gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-zinc-900/50 border border-white/5 text-zinc-400 px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          >
            <option value="all">الحالة: الكل</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-900/50 border border-white/5 text-zinc-400 px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          >
            <option value="all">الدور: الكل</option>
            {appData.roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-zinc-900/50 border border-white/5 text-zinc-400 px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          >
            <option value="all">القسم: الكل</option>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {employees.map(employee => (
          <motion.div
            layout
            key={employee.id}
            className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-all group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                  {employee.avatar ? <img src={employee.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-zinc-600" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{employee.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-zinc-500 text-xs">{appData.roles.find(r => r.id === employee.roleId)?.name}</p>
                    {employee.departmentId && (
                      <p className="text-primary text-xs font-bold">• {appData.departments.find(d => d.id === employee.departmentId)?.name}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                employee.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {employee.status === 'active' ? 'نشط' : 'غير نشط'}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Shield className="w-4 h-4 text-zinc-600" />
                <span>{employee.username}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Calendar className="w-4 h-4 text-zinc-600" />
                <span>انضم في {new Date(employee.joinedDate).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingEmployee(employee)}
                  className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-primary hover:bg-primary-light transition-all" 
                  title="تعديل"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setResettingPassword(employee)}
                  className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all" 
                  title="تغيير كلمة المرور"
                >
                  <Key className="w-4 h-4" />
                </button>
                {currentUser.permissions.includes('full_control') && employee.id !== currentUser.id && (
                  <button 
                    onClick={() => setDeletingEmployee(employee)}
                    className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all" 
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button className="text-xs font-bold text-primary hover:underline">عرض الملف</button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAddModalOpen && <AddEmployeeModal onClose={() => setIsAddModalOpen(false)} />}
        {editingEmployee && <EditEmployeeModal employee={editingEmployee} onClose={() => setEditingEmployee(null)} />}
        {resettingPassword && <ResetPasswordModal employee={resettingPassword} onClose={() => setResettingPassword(null)} />}
        
        {/* Department Management Modal */}
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">إدارة الأقسام</h2>
                <button onClick={() => setIsDeptModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <form onSubmit={handleAddDept} className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="اسم القسم الجديد..."
                      className="flex-1 bg-zinc-800 border border-white/5 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button type="submit" className="bg-primary text-white p-3 rounded-xl hover:bg-primary-hover transition-all">
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 mr-1">يتبع لقسم (اختياري)</label>
                    <select
                      value={selectedParentDeptId}
                      onChange={(e) => setSelectedParentDeptId(e.target.value)}
                      className="w-full bg-zinc-800 border border-white/5 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="">قسم رئيسي</option>
                      {appData.departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </form>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {renderDeptHierarchy()}
                  {appData.departments.length === 0 && (
                    <p className="text-center text-zinc-500 py-4">لا توجد أقسام مضافة</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <ConfirmModal
          isOpen={!!deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onConfirm={handleDeleteUser}
          title="تأكيد حذف الموظف"
          message={`هل أنت متأكد من حذف الموظف ${deletingEmployee?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الموظف"
        />
      </AnimatePresence>
    </div>
  );
};
