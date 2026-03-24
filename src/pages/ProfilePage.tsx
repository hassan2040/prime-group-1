import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { User as UserIcon, Camera, Lock, Save, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { db as firestore } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { db: appData, addAuditLog, uploadFile } = useAppContext();
  
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!user || !appData) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const uploaded = await uploadFile(file);
        
        await updateDoc(doc(firestore, 'users', user.id), {
          avatar: uploaded.url
        });
        
        addAuditLog(user.id, user.name, 'قام بتغيير الصورة الشخصية');
        setMessage({ type: 'success', text: 'تم تحديث الصورة الشخصية بنجاح' });
      } catch (error) {
        setMessage({ type: 'error', text: 'فشل رفع الصورة' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(firestore, 'users', user.id), {
        name: name
      });
      addAuditLog(user.id, user.name, 'قام بتحديث بيانات الملف الشخصي');
      setMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'فشل تحديث البيانات' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمات المرور غير متطابقة' });
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) return;

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addAuditLog(user.id, user.name, 'قام بتغيير كلمة المرور');
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMsg = 'فشل تغيير كلمة المرور';
      if (error.code === 'auth/wrong-password') {
        errorMsg = 'كلمة المرور الحالية غير صحيحة';
      }
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2">الملف الشخصي</h1>
        <p className="text-zinc-500">إدارة بياناتك الشخصية وإعدادات الأمان.</p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl text-center space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <div className="w-full h-full rounded-3xl bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-2xl">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-zinc-600" />
                )}
              </div>
              <label className={`absolute -bottom-2 -right-2 p-3 bg-primary hover:bg-primary-hover rounded-xl cursor-pointer shadow-lg shadow-primary transition-all ${isUploading ? 'animate-pulse' : ''}`}>
                <input type="file" className="hidden" onChange={handleAvatarChange} disabled={isUploading} />
                <Camera className="w-5 h-5 text-white" />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-zinc-500 text-sm">@{user.username}</p>
            </div>
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-primary bg-primary-light py-2 rounded-xl text-xs font-bold">
                <Shield className="w-4 h-4" />
                <span>{appData.roles.find(r => r.id === user.roleId)?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Info */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              البيانات الأساسية
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">الاسم الكامل</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button type="submit" className="bg-white text-zinc-900 px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all">
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              تغيير كلمة المرور
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">كلمة المرور الحالية</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 mr-1">كلمة المرور الجديدة</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 mr-1">تأكيد كلمة المرور</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="bg-amber-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-500 transition-all shadow-lg shadow-amber-900/20">
                <Lock className="w-5 h-5" />
                تحديث كلمة المرور
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
