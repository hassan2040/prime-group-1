import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Building, ShieldCheck, ArrowLeft, Upload, Image as ImageIcon, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';

export const OnboardingPage: React.FC = () => {
  const { db, updateDB, addAuditLog, uploadFile } = useAppContext();
  const { updateUser } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!db) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const uploaded = await uploadFile(file);
        setLogo(uploaded.url);
      } catch (error) {
        console.error('Failed to upload logo:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleComplete = async () => {
    const adminId = 'admin-' + Math.random().toString(36).substr(2, 9);
    const newAdmin: User = {
      id: adminId,
      name: adminName,
      username: adminUsername,
      password: adminPassword, // Will be hashed by server on first login or if I implement hashing here
      roleId: 'ceo',
      permissions: ['full_control'],
      status: 'active',
      joinedDate: new Date().toISOString(),
      avatar: null
    };

    const newDB = {
      ...db,
      users: [newAdmin, ...db.users.filter(u => u.id !== 'admin-1')], // Replace default admin if exists
      company: {
        ...db.company,
        name: companyName || 'مؤسستي',
        logo: logo,
        onboarded: true
      }
    };

    await updateDB(newDB);
    updateUser(newAdmin);
    addAuditLog(newAdmin.id, newAdmin.name, 'أكمل إعدادات النظام الأولية وأنشأ حساب المدير');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans overflow-hidden relative text-right" dir="rtl">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
        
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-black text-white mb-2">إعداد النظام</h1>
              <p className="text-zinc-400 text-sm">لنقم بتهيئة بيئة العمل الخاصة بك</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-zinc-800'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-zinc-800'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-zinc-800'}`}></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary mb-2">
                    <Building className="w-6 h-6" />
                    <h2 className="text-xl font-bold">بيانات المؤسسة</h2>
                  </div>
                  
                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-3 mr-1">اسم الشركة / المؤسسة</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-white/5 text-white px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-right"
                      placeholder="أدخل اسم شركتك هنا"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 text-sm font-medium mb-3 mr-1">شعار الشركة (اختياري)</label>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-zinc-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                        {logo ? <img src={logo} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-zinc-600" />}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isUploading ? 'animate-pulse' : ''}`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'جاري الرفع...' : 'رفع الشعار'}</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                        accept="image/*" 
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!companyName}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary transition-all active:scale-95 disabled:opacity-50"
                >
                  المتابعة
                </button>
              </motion.div>
            ) : step === 2 ? (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-primary mb-2">
                    <UserIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">حساب المدير المسؤول</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-zinc-300 text-sm font-medium mb-3 mr-1">الاسم الكامل</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-white/5 text-white px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-right"
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 text-sm font-medium mb-3 mr-1">اسم المستخدم</label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-white/5 text-white px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-right"
                        placeholder="أدخل اسم المستخدم للدخول"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 text-sm font-medium mb-3 mr-1">كلمة المرور</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-white/5 text-white px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-right"
                        placeholder="أدخل كلمة مرور قوية"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                    <span>رجوع</span>
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!adminName || !adminUsername || !adminPassword}
                    className="flex-[2] bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary transition-all active:scale-95 disabled:opacity-50"
                  >
                    المتابعة
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-emerald-400 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                    <h2 className="text-xl font-bold">تأكيد البيانات</h2>
                  </div>
                  
                  <div className="bg-zinc-800/30 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">اسم الشركة:</span>
                      <span className="font-bold">{companyName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">المدير المسؤول:</span>
                      <span className="font-bold">{adminName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">اسم المستخدم:</span>
                      <span className="font-bold">{adminUsername}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">تاريخ البدء:</span>
                      <span className="font-bold">{new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>

                  <p className="text-zinc-500 text-xs text-center px-8 leading-relaxed">
                    بالنقر على "بدء العمل"، سيتم تفعيل النظام بالكامل وتجهيز لوحة التحكم الخاصة بك. يمكنك دائماً تعديل هذه البيانات من الإعدادات.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                    <span>رجوع</span>
                  </button>
                  <button
                    onClick={handleComplete}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                    بدء العمل الآن
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
