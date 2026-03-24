import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Megaphone,
  ShieldAlert,
  Briefcase,
  User as UserIcon,
  ChevronLeft,
  Search,
  Moon,
  Sun,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const { db: appData } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const unreadNotifications = appData?.notifications.filter(n => n.userId === user?.id && !n.isRead).length || 0;

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, permission: null },
    { id: 'tasks', label: 'المهام', icon: CheckSquare, permission: null },
    { id: 'announcements', label: 'الإعلانات والقرارات', icon: Megaphone, permission: null },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3, permission: 'view_reports' },
    { id: 'employees', label: 'الموظفين', icon: Users, permission: 'manage_employees' },
    { id: 'roles', label: 'المسميات الوظيفية', icon: Briefcase, permission: 'manage_settings' },
    { id: 'permissions', label: 'الصلاحيات', icon: ShieldAlert, permission: 'manage_permissions' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, permission: 'manage_settings' },
    { id: 'profile', label: 'الملف الشخصي', icon: UserIcon, permission: null },
  ];

  const hasPermission = (permission: string | null) => {
    if (!permission) return true;
    if (user?.permissions.includes('full_control')) return true;
    if (user?.email === 'Primegroup0123@gmail.com') return true;
    return user?.permissions.includes(permission as any);
  };

  const filteredMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#0a0a0a] text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col border-l ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200'} transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary overflow-hidden">
                {appData?.company.logo ? (
                  <img src={appData.company.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ShieldAlert className="text-white w-6 h-6" />
                )}
              </div>
              <span className="font-bold text-lg truncate">{appData?.company.name}</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${!isSidebarOpen && 'mx-auto'}`}>
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${
                    activePage === item.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary' 
                      : `hover:bg-white/5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`
                  }`}
                >
                  <item.icon className={`w-6 h-6 shrink-0 ${activePage === item.id ? 'text-white' : 'group-hover:text-primary'}`} />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={logout}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-6 h-6" />
            {isSidebarOpen && <span className="font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute right-0 top-0 bottom-0 w-80 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'} p-6 flex flex-col`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                    {appData?.company.logo ? (
                      <img src={appData.company.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ShieldAlert className="text-white w-6 h-6" />
                    )}
                  </div>
                  <span className="font-bold text-lg">{appData?.company.name}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setActivePage(item.id); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      activePage === item.id 
                        ? 'bg-primary text-white shadow-lg' 
                        : `hover:bg-white/5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-500/10 mt-auto"
              >
                <LogOut className="w-6 h-6" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-20 border-b flex items-center justify-between px-6 shrink-0 z-40 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/5">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="بحث شامل..." 
                className={`pr-11 pl-4 py-2.5 rounded-xl text-sm outline-none transition-all w-64 lg:w-96 ${isDarkMode ? 'bg-zinc-800/50 border-white/5 text-white focus:ring-2 focus:ring-primary' : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:ring-2 focus:ring-primary'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-zinc-900">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute left-0 mt-3 w-80 md:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'}`}
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-bold">الإشعارات</h3>
                      <button className="text-xs text-primary hover:underline">تحديد الكل كمقروء</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {appData?.notifications.filter(n => n.userId === user?.id).length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">لا توجد إشعارات حالياً</div>
                      ) : (
                        appData?.notifications.filter(n => n.userId === user?.id).map(notif => (
                          <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notif.isRead && 'bg-primary-light'}`}>
                            <p className="text-sm font-medium mb-1">{notif.title}</p>
                            <p className="text-xs text-zinc-500 line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-zinc-600 mt-2 block">{new Date(notif.createdAt).toLocaleString('ar-EG')}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-white/5">
                      <button className="text-xs text-zinc-400 hover:text-white transition-colors">عرض جميع الإشعارات</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pr-3 md:pr-6 border-r border-white/5">
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] text-zinc-500">{appData?.roles.find(r => r.id === user?.roleId)?.name}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-zinc-400" />}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
