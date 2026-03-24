import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DB } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ems_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const loggedInUser = await res.json();
        setUser(loggedInUser);
        localStorage.setItem('ems_user', JSON.stringify(loggedInUser));
        setIsLoading(false);
        return true;
      } else {
        // Handle non-JSON or error responses
        let errorMessage = 'فشل تسجيل الدخول';
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await res.text();
            console.error('Non-JSON response from login:', text.substring(0, 100));
            errorMessage = `خطأ في الخادم (${res.status})`;
          }
        } catch (e) {
          console.error('Error parsing login error response:', e);
        }
        console.error('Login failed:', errorMessage);
      }
    } catch (error) {
      console.error('Login network error:', error);
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems_user');
  };

  const updateUser = (updatedUser: User) => {
    const userToSave = { ...updatedUser };
    delete userToSave.password;
    setUser(userToSave);
    localStorage.setItem('ems_user', JSON.stringify(userToSave));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser }}>
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
