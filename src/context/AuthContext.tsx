import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else if (firebaseUser.email === 'Primegroup0123@gmail.com') {
            // Bootstrap admin user if it doesn't exist
            const adminUser: User = {
              id: firebaseUser.uid,
              username: 'admin',
              email: firebaseUser.email || undefined,
              name: firebaseUser.displayName || 'المدير العام',
              roleId: 'ceo',
              departmentId: '',
              permissions: ['full_control', 'view_performance', 'manage_employees', 'manage_announcements', 'manage_permissions', 'manage_settings', 'create_tasks'],
              status: 'active',
              joinedDate: new Date().toISOString().split('T')[0],
              avatar: firebaseUser.photoURL || null
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), adminUser);
            setUser(adminUser);
          } else {
            // This might happen if auth exists but user doc doesn't (rare)
            console.warn('User authenticated but Firestore document missing. Signing out.');
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const email = `${username.toLowerCase()}@ems.local`;
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
