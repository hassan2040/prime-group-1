import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Building, 
  Image as ImageIcon, 
  Save, 
  Database, 
  ShieldAlert,
  Download,
  Upload,
  History
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsPageProps {
  setActivePage: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setActivePage }) => {
  const { db: appData, updateDB, addAuditLog, uploadFile, showToast } = useAppContext();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState(appData?.company.name || '');
  const [loginTitle, setLoginTitle] = useState(appData?.company.loginTitle || '');
  const [loginSubtitle, setLoginSubtitle] = useState(appData?.company.loginSubtitle || '');
  const [loginBg, setLoginBg] = useState(appData?.company.loginBg || '');
  const [primaryColor, setPrimaryColor] = useState(appData?.company.primaryColor || '#2563eb');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!appData || !user) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const uploaded = await uploadFile(file);
        const newDB = { ...appData, company: { ...appData.company, logo: uploaded.url } };
        await updateDB(newDB);
        addAuditLog(user.id, user.name, 'تغيير شعار الشركة');
        showToast('تم تحديث الشعار بنجاح');
      } catch (error) {
        showToast('فشل في رفع الشعار', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveSettings = async () => {
    const newDB = { 
      ...appData, 
      company: { 
        ...appData.company, 
        name: companyName,
        loginTitle,
        loginSubtitle,
        loginBg,
        primaryColor
      } 
    };
    await updateDB(newDB);
    addAuditLog(user.id, user.name, 'تعديل إعدادات الشركة وتخصيص صفحة الدخول');
    showToast('تم حفظ الإعدادات بنجاح');
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ems_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = JSON.parse(event.target?.result as string);
          if (content.users && content.tasks && content.announcements) {
            await updateDB(content);
            addAuditLog(user.id, user.name, 'استعادة نسخة احتياطية للبيانات');
            showToast('تم استعادة البيانات بنجاح');
          } else {
            showToast('تنسيق الملف غير صالح', 'error');
          }
        } catch (error) {
          showToast('فشل في قراءة الملف', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">إعدادات النظام</h1>
          <p className="text-zinc-500">التحكم في إعدادات المؤسسة والبيانات الأساسية والنسخ الاحتياطي.</p>
        </div>
        <button 
          onClick={() => setActivePage('audit-log')} 
          className="bg-zinc-900/50 border border-white/5 text-zinc-400 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white/5 transition-all"
        >
          <History className="w-4 h-4" />
          <span>سجل النشاطات الكامل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Company Info */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Building className="w-6 h-6 text-primary" />
                بيانات المؤسسة
              </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">اسم الشركة</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">شعار الشركة</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                    {appData.company.logo ? (
                      <img src={appData.company.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all ${isUploading ? 'animate-pulse' : ''}`}
                  >
                    {isUploading ? 'جاري الرفع...' : 'تغيير الشعار'}
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

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary transition-all active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>حفظ التغييرات</span>
              </button>
            </div>
          </div>

          {/* Login Page Customization */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-emerald-400" />
              تخصيص صفحة الدخول
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">العنوان الرئيسي (صفحة الدخول)</label>
                <input 
                  type="text" 
                  value={loginTitle}
                  onChange={(e) => setLoginTitle(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  placeholder="مثال: Prime Group For Engineering Industries"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">العنوان الفرعي (صفحة الدخول)</label>
                <input 
                  type="text" 
                  value={loginSubtitle}
                  onChange={(e) => setLoginSubtitle(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  placeholder="مثال: BOMAN & Thermoflow"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">رابط خلفية صفحة الدخول</label>
                <input 
                  type="text" 
                  value={loginBg}
                  onChange={(e) => setLoginBg(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  placeholder="رابط الصورة (URL)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">اللون الأساسي للنظام</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-14 h-14 bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>حفظ التخصيص</span>
              </button>
            </div>
          </div>

          {/* System Data */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Database className="w-6 h-6 text-amber-400" />
              إدارة البيانات
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleBackup}
                className="flex items-center justify-between p-6 bg-zinc-800/30 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-all group"
              >
                <div className="text-right">
                  <p className="font-bold mb-1">نسخة احتياطية</p>
                  <p className="text-[10px] text-zinc-500">تحميل ملف JSON لجميع البيانات</p>
                </div>
                <Download className="w-6 h-6 text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </button>
              
              <label className="flex items-center justify-between p-6 bg-zinc-800/30 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-all group cursor-pointer">
                <div className="text-right">
                  <p className="font-bold mb-1">استعادة البيانات</p>
                  <p className="text-[10px] text-zinc-500">رفع ملف نسخة احتياطية سابقة</p>
                </div>
                <Upload className="w-6 h-6 text-zinc-600 group-hover:text-primary transition-colors" />
                <input type="file" className="hidden" onChange={handleRestore} accept=".json" />
              </label>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <History className="w-6 h-6 text-zinc-400" />
            سجل النشاطات
          </h2>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {appData.auditLog.length === 0 ? (
              <p className="text-center text-zinc-600 py-10">لا توجد نشاطات مسجلة</p>
            ) : (
              appData.auditLog.map(log => (
                <div key={log.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-sm font-medium mb-1">{log.action}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>بواسطة: {log.userName}</span>
                    <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
