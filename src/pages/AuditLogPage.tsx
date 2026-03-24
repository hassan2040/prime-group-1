import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  History, 
  Search, 
  Filter, 
  User as UserIcon, 
  Clock, 
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const AuditLogPage: React.FC = () => {
  const { db: appData } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  if (!appData) return null;

  const logs = [...appData.auditLog]
    .filter(log => 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActionIcon = (action: string) => {
    if (action.includes('حذف')) return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (action.includes('عدل') || action.includes('تغيير')) return <Activity className="w-4 h-4 text-amber-400" />;
    if (action.includes('إنشاء') || action.includes('إضافة')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    return <Clock className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">سجل النشاطات (Audit Log)</h1>
          <p className="text-zinc-500">تتبع جميع العمليات الحساسة والتغييرات في النظام.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input 
          type="text" 
          placeholder="البحث في السجلات (اسم الموظف أو نوع العملية)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-8 py-6 font-bold">العملية</th>
                <th className="px-8 py-6 font-bold">الموظف</th>
                <th className="px-8 py-6 font-bold">التاريخ والوقت</th>
                <th className="px-8 py-6 font-bold">المعرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-zinc-600">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>لا توجد نشاطات مسجلة تطابق بحثك</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    key={log.id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="font-bold text-sm">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-zinc-500" />
                        </div>
                        <span className="text-sm text-zinc-400">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs text-zinc-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] text-zinc-600 font-mono uppercase">{log.id}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
