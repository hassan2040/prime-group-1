import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DB, Task, Announcement, User, Notification, AuditLog, CompanySettings, Role, Department } from '../types';
import { db, storage, auth } from '../firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [appData, setAppData] = useState<DB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    // 1. Always listen to company settings (public read)
    const unsubCompany = onSnapshot(doc(db, 'company', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        const company = docSnap.data() as CompanySettings;
        setAppData(prev => prev ? { ...prev, company } : { 
          company, 
          users: [], 
          roles: [], 
          departments: [], 
          tasks: [], 
          announcements: [], 
          notifications: [], 
          auditLog: [] 
        });
      } else {
        setAppData(prev => prev ? { ...prev, company: { name: '', logo: null, onboarded: false } } : {
          company: { name: '', logo: null, onboarded: false },
          users: [], roles: [], departments: [], tasks: [], announcements: [], notifications: [], auditLog: []
        });
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'company/settings');
    });

    // 2. Only listen to other collections if authenticated
    let unsubs: (() => void)[] = [unsubCompany];

    if (!isAuthLoading && user) {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const users = snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
        setAppData(prev => prev ? { ...prev, users } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

      const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => {
        const tasks = snap.docs.map(d => ({ ...d.data(), id: d.id } as Task));
        setAppData(prev => prev ? { ...prev, tasks } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

      const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')), (snap) => {
        const announcements = snap.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
        setAppData(prev => prev ? { ...prev, announcements } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'announcements'));

      const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), (snap) => {
        const notifications = snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification));
        setAppData(prev => prev ? { ...prev, notifications } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

      const unsubAuditLog = onSnapshot(query(collection(db, 'auditLog'), orderBy('timestamp', 'desc')), (snap) => {
        const auditLog = snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
        setAppData(prev => prev ? { ...prev, auditLog } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'auditLog'));

      const unsubRoles = onSnapshot(collection(db, 'roles'), (snap) => {
        const roles = snap.docs.map(d => ({ ...d.data(), id: d.id } as Role));
        setAppData(prev => prev ? { ...prev, roles } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'roles'));

      const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => {
        const departments = snap.docs.map(d => ({ ...d.data(), id: d.id } as Department));
        setAppData(prev => prev ? { ...prev, departments } : null);
      }, (error) => handleFirestoreError(error, OperationType.GET, 'departments'));

      unsubs.push(unsubUsers, unsubTasks, unsubAnnouncements, unsubNotifications, unsubAuditLog, unsubRoles, unsubDepts);
    }

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [user, isAuthLoading]);

  const refreshData = async () => {
    // onSnapshot handles this
  };

  const addNotification = async (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const path = 'notifications';
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, path, id), {
        ...notif,
        id,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateDB = async (newDB: DB) => {
    const path = 'company/settings';
    try {
      await setDoc(doc(db, 'company', 'settings'), newDB.company);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addAuditLog = async (userId: string, userName: string, action: string) => {
    const path = 'auditLog';
    try {
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, path, id), {
        id,
        userId,
        userName,
        action,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string }> => {
    try {
      if (!storage) throw new Error('Storage not initialized');
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return { url, name: file.name };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('فشل الاتصال بـ Firebase Storage. يرجى التأكد من تفعيل الـ Storage في لوحة تحكم Firebase والضغط على Get Started.');
      }
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ db: appData, isLoading, refreshData, updateDB, addAuditLog, addNotification, uploadFile, showToast, toasts }}>
      {children}
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
