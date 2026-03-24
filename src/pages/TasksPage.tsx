import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User as UserIcon,
  Paperclip,
  MessageSquare,
  ChevronRight,
  Calendar,
  Flag,
  CheckSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, User } from '../types';

import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskReportModal } from '../components/TaskReportModal';

export const TasksPage: React.FC = () => {
  const { db, updateDB, addAuditLog, addNotification } = useAppContext();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'my' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!db || !user) return null;

  const filteredTasks = db.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'my') return task.assignedTo.includes(user.id);
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'pending') return task.status !== 'completed';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-amber-400 bg-amber-500/10';
      case 'medium': return 'text-primary bg-primary-light';
      case 'low': return 'text-zinc-400 bg-zinc-500/10';
      default: return 'text-zinc-400 bg-zinc-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'جديد';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'منجز';
      case 'delayed': return 'متأخر';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const calculateProgress = (task: Task) => {
    if (task.type === 'individual') return task.status === 'completed' ? 100 : 0;
    const completions = task.reports.length;
    return Math.round((completions / task.assignedTo.length) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">إدارة المهام</h1>
          <p className="text-zinc-500">تابع تقدم المهام، كلف الموظفين، وأشرف على الإنجاز.</p>
        </div>
        {(user.permissions.includes('full_control') || user.permissions.includes('create_tasks')) && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>مهمة جديدة</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="البحث في المهام..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'my', label: 'مهامي' },
            { id: 'pending', label: 'قيد التنفيذ' },
            { id: 'completed', label: 'المنجزة' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-3.5 rounded-2xl font-medium whitespace-nowrap transition-all ${
                filter === f.id 
                  ? 'bg-white text-zinc-900 shadow-lg' 
                  : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="w-10 h-10 text-zinc-700" />
            </div>
            <p className="text-zinc-500">لا توجد مهام تطابق البحث الحالي</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <motion.div
              layout
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'urgent' ? 'عاجل جداً' : task.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                  </span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] text-zinc-500">
                    {task.type === 'individual' ? 'فردية' : 'جماعية'}
                  </span>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{task.title}</h3>
              <p className="text-zinc-500 text-sm mb-6 line-clamp-2 leading-relaxed">{task.description}</p>

              {task.type === 'group' && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-zinc-500">نسبة الإنجاز الكلي</span>
                    <span className="text-primary">{calculateProgress(task)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${calculateProgress(task)}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {task.assignedTo.slice(0, 3).map(uid => {
                    const assignee = db.users.find(u => u.id === uid);
                    return (
                      <div key={uid} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden" title={assignee?.name}>
                        {assignee?.avatar ? <img src={assignee.avatar} alt="" /> : <UserIcon className="w-4 h-4 text-zinc-500" />}
                      </div>
                    );
                  })}
                  {task.assignedTo.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      +{task.assignedTo.length - 3}
                    </div>
                  )}
                </div>
                <div className="h-4 w-px bg-white/5"></div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(task.deadline).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{task.attachments.length}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{task.reports.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-emerald-500' : 
                    task.status === 'delayed' ? 'bg-red-500' : 
                    'bg-primary'
                  }`}></span>
                  <span className="text-xs font-medium text-zinc-400">{getStatusLabel(task.status)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">تفاصيل المهمة</h2>
                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(selectedTask.priority)}`}>
                          {selectedTask.priority === 'urgent' ? 'عاجل جداً' : selectedTask.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                        </span>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-zinc-400 font-bold">
                          {selectedTask.type === 'individual' ? 'فردية' : 'جماعية'}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black mb-4">{selectedTask.title}</h3>
                      <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-zinc-500" />
                        المرفقات
                      </h4>
                      {selectedTask.attachments.length === 0 ? (
                        <p className="text-xs text-zinc-600">لا توجد مرفقات لهذه المهمة</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {selectedTask.attachments.map((file, idx) => (
                            <div key={idx} className="bg-zinc-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-white/5">
                              <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-72 space-y-6">
                    <div className="bg-zinc-800/30 p-6 rounded-2xl border border-white/5 space-y-4">
                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">الحالة</p>
                        <p className="font-bold text-primary">{getStatusLabel(selectedTask.status)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">الموعد النهائي</p>
                        <p className="font-bold">{new Date(selectedTask.deadline).toLocaleDateString('ar-EG')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">تاريخ الإنشاء</p>
                        <p className="text-sm">{new Date(selectedTask.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold mb-3">المكلفون</h4>
                      <div className="space-y-2">
                        {selectedTask.assignedTo.map(uid => {
                          const assignee = db.users.find(u => u.id === uid);
                          const hasReport = selectedTask.reports.some(r => r.userId === uid);
                          return (
                            <div key={uid} className="flex items-center justify-between bg-zinc-800/50 px-3 py-2 rounded-xl">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden">
                                  {assignee?.avatar ? <img src={assignee.avatar} alt="" /> : <UserIcon className="w-3 h-3" />}
                                </div>
                                <span className="text-xs">{assignee?.name}</span>
                              </div>
                              {hasReport && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports Section */}
                <div className="pt-8 border-t border-white/5">
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    تقارير الإنجاز ({selectedTask.reports.length})
                  </h4>
                  <div className="space-y-4">
                    {selectedTask.reports.length === 0 ? (
                      <p className="text-center text-zinc-600 py-8">لا توجد تقارير إنجاز بعد</p>
                    ) : (
                      selectedTask.reports.map((report, idx) => (
                        <div key={idx} className="bg-zinc-800/30 border border-white/5 p-6 rounded-2xl">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-zinc-500" />
                              </div>
                              <span className="font-bold text-sm">{report.userName}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500">{new Date(report.completedAt).toLocaleString('ar-EG')}</span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed">{report.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex justify-end gap-3">
                <button onClick={() => setSelectedTask(null)} className="px-8 py-3 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all">إغلاق</button>
                {selectedTask.assignedTo.includes(user.id) && !selectedTask.reports.some(r => r.userId === user.id) && (
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="px-10 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                    إنجاز المهمة
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} />}
        {isReportModalOpen && selectedTask && (
          <TaskReportModal 
            task={selectedTask} 
            onClose={() => {
              setIsReportModalOpen(false);
              setSelectedTask(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
