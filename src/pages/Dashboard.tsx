import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckSquare,
  Megaphone,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { db } = useAppContext();
  const { user } = useAuth();

  if (!db || !user) return null;

  const userTasks = db.tasks.filter(t => t.assignedTo.includes(user.id));
  const completedTasks = userTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = userTasks.filter(t => t.status === 'in_progress' || t.status === 'new').length;
  const delayedTasks = userTasks.filter(t => t.status === 'delayed').length;
  const unreadAnnouncements = db.announcements.filter(a => !a.readBy.includes(user.id) && !a.isArchived).length;

  const stats = [
    { label: 'إجمالي مهامي', value: userTasks.length, icon: FileText, color: 'primary' },
    { label: 'المهام المنجزة', value: completedTasks, icon: CheckCircle2, color: 'emerald' },
    { label: 'مهام قيد التنفيذ', value: pendingTasks, icon: Clock, color: 'amber' },
    { label: 'مهام متأخرة', value: delayedTasks, icon: AlertCircle, color: 'red' },
  ];

  const isAdmin = user.permissions.includes('full_control') || user.permissions.includes('view_performance');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">مرحباً، {user.name} 👋</h1>
          <p className="text-zinc-500">إليك نظرة سريعة على أداء اليوم والمهام المطلوبة.</p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 p-2 rounded-2xl">
          <Calendar className="w-5 h-5 text-primary mr-2" />
          <span className="text-sm font-medium ml-2">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color === 'primary' ? 'bg-primary' : `bg-${stat.color}-500`}/10 blur-3xl rounded-full -mr-12 -mt-12 group-hover:${stat.color === 'primary' ? 'bg-primary' : `bg-${stat.color}-500`}/20 transition-all`}></div>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.color === 'primary' ? 'bg-primary-light' : `bg-${stat.color}-500/10`} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary' : `text-${stat.color}-400`}`} />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+12%</span>
              </div>
            </div>
            <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              آخر المهام المكلف بها
            </h2>
            <button className="text-sm text-primary hover:underline">عرض الكل</button>
          </div>
          
          <div className="space-y-4">
            {userTasks.length === 0 ? (
              <div className="bg-zinc-900/30 border border-dashed border-white/10 p-12 rounded-3xl text-center text-zinc-500">
                لا توجد مهام حالياً
              </div>
            ) : (
              userTasks.slice(0, 5).map(task => (
                <div key={task.id} className="bg-zinc-900/50 border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${
                      task.priority === 'urgent' ? 'bg-red-500' : 
                      task.priority === 'high' ? 'bg-amber-500' : 
                      'bg-primary'
                    }`}></div>
                    <div>
                      <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.deadline).toLocaleDateString('ar-EG')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          task.status === 'delayed' ? 'bg-red-500/10 text-red-400' :
                          'bg-primary-light text-primary'
                        }`}>
                          {task.status === 'completed' ? 'منجز' : task.status === 'delayed' ? 'متأخر' : 'قيد التنفيذ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements & Performance */}
        <div className="space-y-8">
            <div className="bg-primary p-6 rounded-3xl shadow-xl shadow-primary transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                إعلانات جديدة
              </h3>
              <p className="text-white/80 text-sm mb-6">لديك {unreadAnnouncements} إعلانات لم تقرأها بعد. تأكد من الإطلاع عليها.</p>
              <button className="w-full py-3 bg-white text-primary font-bold rounded-2xl shadow-lg hover:bg-zinc-100 transition-all">
                عرض الإعلانات
              </button>
            </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl">
            <h3 className="font-bold mb-6 flex items-center justify-between">
              <span>أداء الموظفين</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </h3>
            <div className="space-y-6">
              {db.users.slice(0, 4).map(u => {
                const completed = db.tasks.filter(t => t.assignedTo.includes(u.id) && t.status === 'completed').length;
                const total = db.tasks.filter(t => t.assignedTo.includes(u.id)).length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <div key={u.id}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">{u.name}</span>
                      <span className="text-zinc-500">{percent}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        className="h-full bg-primary rounded-full"
                      ></motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
