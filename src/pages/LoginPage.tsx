import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { db } = useAppContext();

  const company = db?.company;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    const success = await login(username, password);
    if (!success) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans overflow-hidden relative"
      style={company?.loginBg ? { 
        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${company.loginBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      } : {}}
    >
      {/* Background decorative elements - only show if no custom bg */}
          {!company?.loginBg && (
            <>
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full"></div>
            </>
          )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 w-full h-1" 
            style={{ backgroundColor: company?.primaryColor || '#2563eb' }}
          ></div>
          
          <div className="text-center mb-10">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg overflow-hidden"
              style={{ 
                backgroundColor: company?.primaryColor || '#2563eb',
                boxShadow: `0 10px 15px -3px ${company?.primaryColor}33`
              }}
            >
              {company?.logo ? (
                <img src={company.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
              {company?.loginTitle || 'نظام إدارة المؤسسة'}
            </h1>
            {company?.loginSubtitle && (
              <p className="text-zinc-400 text-sm mb-4 font-medium">{company.loginSubtitle}</p>
            )}
            <p className="text-zinc-500 text-xs">سجل الدخول للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2 mr-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl focus:ring-2 outline-none transition-all placeholder:text-zinc-600"
                  style={{ '--tw-ring-color': company?.primaryColor || '#2563eb' } as any}
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2 mr-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl focus:ring-2 outline-none transition-all placeholder:text-zinc-600"
                  style={{ '--tw-ring-color': company?.primaryColor || '#2563eb' } as any}
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: company?.primaryColor || '#2563eb',
                boxShadow: `0 10px 15px -3px ${company?.primaryColor}33`
              }}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-xs">
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {company?.name || 'نظام إدارة المؤسسة'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
