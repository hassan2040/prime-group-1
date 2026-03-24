import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

import { OnboardingPage } from './pages/OnboardingPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { db, isLoading: isAppLoading, toasts } = useAppContext();
  const [activePage, setActivePage] = useState('dashboard');

  if (isLoading || isAppLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (db && !db.company.onboarded) {
    return <OnboardingPage />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const primaryColor = db?.company.primaryColor || '#2563eb';

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TasksPage />;
      case 'announcements': return <AnnouncementsPage />;
      case 'reports': return <ReportsPage />;
      case 'audit-log': return <AuditLogPage />;
      case 'employees': return <EmployeesPage />;
      case 'roles': return <RolesPage />;
      case 'permissions': return <PermissionsPage />;
      case 'settings': return <SettingsPage setActivePage={setActivePage} />;
      case 'profile': return <ProfilePage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      <style>
        {`
          :root {
            --primary-color: ${primaryColor};
            --primary-color-hover: ${primaryColor}dd;
            --primary-color-light: ${primaryColor}15;
            --primary-color-border: ${primaryColor}30;
          }
          .bg-primary { background-color: var(--primary-color); }
          .bg-primary-light { background-color: var(--primary-color-light); }
          .text-primary { color: var(--primary-color); }
          .border-primary { border-color: var(--primary-color); }
          .border-primary-light { border-color: var(--primary-color-border); }
          .hover\\:bg-primary-hover:hover { background-color: var(--primary-color-hover); }
          .hover\\:text-primary:hover { color: var(--primary-color); }
          .focus\\:ring-primary:focus { --tw-ring-color: var(--primary-color-border); }
          .shadow-primary { --tw-shadow-color: var(--primary-color-border); }
        `}
      </style>
      {renderPage()}
      
      {/* Toasts UI */}
      <div className="fixed bottom-8 left-8 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[300px] backdrop-blur-xl ${
                toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              <span className="font-bold text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
