import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DB, Task, Announcement, User, Notification, AuditLog, CompanySettings, Role } from '../types';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  db: DB | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateDB: (newDB: DB) => Promise<void>;
  addAuditLog: (userId: string, userName: string, action: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  uploadFile: (file: File) => Promise<{ url: string; name: string }>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  toasts: Toast[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/db');
      const contentType = res.headers.get('content-type');
      
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setDb(data);
      } else {
        const text = await res.text();
        console.error('Failed to fetch DB:', res.status, text.substring(0, 100));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addNotification = async (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    setDb(currentDb => {
      if (!currentDb) return currentDb;
      const newNotif: Notification = {
        ...notif,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      const newDB = { ...currentDb, notifications: [newNotif, ...currentDb.notifications] };
      
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      }).catch(err => console.error('Error persisting notification:', err));
      
      return newDB;
    });
  };

  // Deadline notification system
  useEffect(() => {
    if (!db) return;

    const checkDeadlines = () => {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      db.tasks.forEach(task => {
        if (task.status === 'completed' || task.status === 'cancelled') return;
        
        const deadline = new Date(task.deadline);
        if (deadline > now && deadline <= oneDayFromNow) {
          // Check if notification already exists for this task deadline
          const alreadyNotified = db.notifications.some(n => 
            n.type === 'task_deadline' && 
            n.link === '/tasks' && 
            n.message.includes(task.title) &&
            new Date(n.createdAt).getTime() > now.getTime() - 24 * 60 * 60 * 1000
          );

          if (!alreadyNotified) {
            task.assignedTo.forEach(userId => {
              addNotification({
                userId,
                title: 'اقتراب موعد تسليم مهمة',
                message: `المهمة "${task.title}" تنتهي خلال أقل من 24 ساعة.`,
                type: 'task_deadline',
                link: '/tasks'
              });
            });
          }
        }
      });
    };

    const interval = setInterval(checkDeadlines, 1000 * 60 * 60); // Check every hour
    checkDeadlines(); // Initial check

    return () => clearInterval(interval);
  }, [db?.tasks, addNotification]);

  const updateDB = async (newDB: DB) => {
    try {
      setDb(newDB); // Optimistic update
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      });
    } catch (error) {
      console.error('Error updating DB:', error);
      // Optional: rollback if needed, but for this app optimistic is usually fine
      refreshData(); 
    }
  };

  const addAuditLog = async (userId: string, userName: string, action: string) => {
    setDb(currentDb => {
      if (!currentDb) return currentDb;
      const newLog: AuditLog = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        userName,
        action,
        timestamp: new Date().toISOString(),
      };
      const newDB = { ...currentDb, auditLog: [newLog, ...currentDb.auditLog] };
      
      // We still need to persist it
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDB),
      }).catch(err => console.error('Error persisting audit log:', err));
      
      return newDB;
    });
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  };

  return (
    <AppContext.Provider value={{ db, isLoading, refreshData, updateDB, addAuditLog, addNotification, uploadFile, showToast, toasts }}>
      {children}
      {/* Toast UI */}
      <div className="fixed bottom-8 left-8 z-[200] space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl pointer-events-auto flex items-center gap-3 animate-in slide-in-from-left-10 duration-300 ${
              toast.type === 'success' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' :
              toast.type === 'error' ? 'bg-red-600/20 border-red-500/50 text-red-400' :
              'bg-blue-600/20 border-blue-500/50 text-blue-400'
            }`}
          >
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
