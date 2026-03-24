import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Filter,
  Calendar,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { db: appData } = useAppContext();
  const [timeRange, setTimeRange] = useState('month');

  if (!appData) return null;

  // Task Statistics
  const totalTasks = appData.tasks.length;
  const completedTasks = appData.tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = appData.tasks.filter(t => t.status === 'in_progress' || t.status === 'new').length;
  const pendingTasks = appData.tasks.filter(t => t.status === 'pending').length;
  const overdueTasks = appData.tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.deadline) < new Date()).length;

  const totalEstimatedHours = appData.tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
  const totalActualHours = appData.tasks.reduce((acc, t) => acc + (t.actualHours || 0), 0);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Heatmap Data (Last 30 days)
  const heatmapData = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = appData.tasks.filter(t => 
      t.status === 'completed' && 
      t.reports.some(r => r.completedAt.startsWith(dateStr))
    ).length;
    return { date: dateStr, count };
  });

  // Data for Task Status Chart
  const statusData = [
    { name: 'مكتملة', value: completedTasks, color: '#10b981' },
    { name: 'قيد التنفيذ', value: inProgressTasks, color: 'var(--primary-color)' },
    { name: 'قيد الانتظار', value: pendingTasks, color: '#f59e0b' },
    { name: 'متأخرة', value: overdueTasks, color: '#ef4444' },
  ];

  // Data for Employee Performance
  const employeePerformance = appData.users.map(user => {
    const userTasks = appData.tasks.filter(t => t.assignedTo.includes(user.id));
    const userCompleted = userTasks.filter(t => t.status === 'completed').length;
    return {
      name: user.name,
      completed: userCompleted,
      total: userTasks.length,
      rate: userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0
    };
  }).sort((a, b) => b.completed - a.completed).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">التقارير والإحصائيات</h1>
          <p className="text-zinc-500">تحليل شامل لأداء المؤسسة وإنجازات الموظفين.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-900/50 border border-white/5 text-white px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">آخر أسبوع</option>
            <option value="month">آخر شهر</option>
            <option value="year">آخر سنة</option>
          </select>
          <button className="bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95">
            <Download className="w-4 h-4" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'total-tasks', label: 'إجمالي المهام', value: totalTasks, icon: FileText, color: 'primary' },
          { id: 'completion-rate', label: 'نسبة الإنجاز', value: `${completionRate}%`, icon: TrendingUp, color: 'emerald' },
          { id: 'actual-hours', label: 'ساعات العمل الفعلية', value: `${totalActualHours} / ${totalEstimatedHours}`, icon: Clock, color: 'amber' },
          { id: 'active-users', label: 'الموظفين النشطين', value: appData.users.filter(u => u.status === 'active').length, icon: Users, color: 'purple' },
        ].map((stat) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={stat.id}
            className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.color === 'primary' ? 'bg-primary-light' : `bg-${stat.color}-500/10`} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color === 'primary' ? 'text-primary' : `text-${stat.color}-500`}`} />
            </div>
            <p className="text-zinc-500 text-sm mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Task Completion Heatmap */}
      <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">كثافة إنجاز المهام (آخر 30 يوم)</h3>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>أقل</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-800" />
              <div className="w-3 h-3 rounded-sm bg-primary/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/60" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
            </div>
            <span>أكثر</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {heatmapData.map((day) => {
            const intensity = day.count === 0 ? 'bg-zinc-800' : 
                             day.count < 3 ? 'bg-primary/30' :
                             day.count < 6 ? 'bg-primary/60' : 'bg-primary';
            return (
              <div 
                key={day.date}
                title={`${day.date}: ${day.count} مهام`}
                className={`w-8 h-8 rounded-lg ${intensity} transition-all hover:scale-110 cursor-help flex items-center justify-center text-[10px] font-bold text-white/50`}
              >
                {day.count > 0 && day.count}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Status Chart */}
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8">توزيع حالات المهام</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-8">أكثر الموظفين إنجازاً</h3>
          <div className="space-y-6">
            {employeePerformance.map((emp) => (
              <div key={emp.name} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">{emp.name}</span>
                  <span className="text-zinc-500">{emp.completed} مهمة مكتملة</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${emp.rate}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">تفاصيل أداء الأقسام</h3>
          <button className="text-sm text-primary font-bold hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-8 py-4 font-bold">القسم / الدور</th>
                <th className="px-8 py-4 font-bold">إجمالي المهام</th>
                <th className="px-8 py-4 font-bold">المكتملة</th>
                <th className="px-8 py-4 font-bold">قيد التنفيذ</th>
                <th className="px-8 py-4 font-bold">نسبة النجاح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {appData.roles.map((role) => {
                const roleUsers = appData.users.filter(u => u.roleId === role.id).map(u => u.id);
                const roleTasks = appData.tasks.filter(t => t.assignedTo.some(id => roleUsers.includes(id)));
                const roleCompleted = roleTasks.filter(t => t.status === 'completed').length;
                const roleInProgress = roleTasks.filter(t => t.status === 'in_progress' || t.status === 'new').length;
                const roleRate = roleTasks.length > 0 ? Math.round((roleCompleted / roleTasks.length) * 100) : 0;

                return (
                  <tr key={role.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-4 font-bold">{role.name}</td>
                    <td className="px-8 py-4 text-zinc-400">{roleTasks.length}</td>
                    <td className="px-8 py-4 text-emerald-400">{roleCompleted}</td>
                    <td className="px-8 py-4 text-primary">{roleInProgress}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        roleRate > 70 ? 'bg-emerald-500/10 text-emerald-400' : 
                        roleRate > 40 ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {roleRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
