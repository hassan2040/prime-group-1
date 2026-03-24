import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  Archive, 
  Paperclip,
  Clock,
  User as UserIcon,
  X,
  Trash2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Announcement } from '../types';
import { db as firestore } from '../firebase';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';

export const AnnouncementsPage: React.FC = () => {
  const { db: appData, addAuditLog, showToast } = useAppContext();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  if (!appData || !user) return null;

  const announcements = appData.announcements.filter(a => 
    (showArchived ? a.isArchived : !a.isArchived) && 
    (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAcknowledge = async (id: string) => {
    try {
      const announcement = appData.announcements.find(a => a.id === id);
      if (announcement && !announcement.acknowledgedBy.includes(user.id)) {
        const annRef = doc(firestore, 'announcements', id);
        const updates: any = {
          acknowledgedBy: arrayUnion(user.id)
        };
        if (!announcement.readBy.includes(user.id)) {
          updates.readBy = arrayUnion(user.id);
        }
        await updateDoc(annRef, updates);
        addAuditLog(user.id, user.name, `أكد العلم بالإعلان: ${announcement.title}`);
      }
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
    }
  };

  const handleRead = async (id: string) => {
    try {
      const announcement = appData.announcements.find(a => a.id === id);
      if (announcement && !announcement.readBy.includes(user.id)) {
        const annRef = doc(firestore, 'announcements', id);
        await updateDoc(annRef, {
          readBy: arrayUnion(user.id)
        });
      }
    } catch (error) {
      console.error('Error reading announcement:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const announcement = appData.announcements.find(a => a.id === id);
      if (announcement) {
        const annRef = doc(firestore, 'announcements', id);
        await updateDoc(annRef, {
          isArchived: !announcement.isArchived
        });
        addAuditLog(user.id, user.name, `${!announcement.isArchived ? 'أرشف' : 'استعاد'} الإعلان: ${announcement.title}`);
      }
    } catch (error) {
      console.error('Error archiving announcement:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    try {
      await deleteDoc(doc(firestore, 'announcements', deletingAnnouncement.id));
      addAuditLog(user.id, user.name, `حذف الإعلان: ${deletingAnnouncement.title}`);
      showToast(`تم حذف الإعلان بنجاح`);
      setDeletingAnnouncement(null);
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="البحث في الإعلانات..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/5 text-white pr-12 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all min-w-[300px]"
            />
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all ${
              showArchived ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900/50 border border-white/5 text-zinc-400 hover:bg-white/5'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span>{showArchived ? 'عرض النشطة' : 'الأرشيف'}</span>
          </button>
        </div>
        {(user.permissions.includes('full_control') || user.permissions.includes('create_announcements')) && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>إعلان جديد</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-white/10 p-20 rounded-3xl text-center text-zinc-500">
            <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>{showArchived ? 'لا توجد إعلانات مؤرشفة' : 'لا توجد إعلانات حالياً'}</p>
          </div>
        ) : (
          announcements.map(announcement => (
            <motion.div
              layout
              key={announcement.id}
              onViewportEnter={() => handleRead(announcement.id)}
              className={`bg-zinc-900/50 border p-8 rounded-3xl transition-all relative overflow-hidden ${
                !announcement.readBy.includes(user.id) ? 'border-primary/30' : 'border-white/5'
              }`}
            >
              {!announcement.readBy.includes(user.id) && (
                <div className="absolute top-0 right-0 w-2 h-full bg-primary"></div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        announcement.type === 'acknowledge' ? 'bg-amber-500/10 text-amber-400' : 'bg-primary-light text-primary'
                      }`}>
                        {announcement.type === 'acknowledge' ? 'يتطلب تأشير بالعلم' : 'إعلان عام'}
                      </span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(announcement.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    
                    {(user.permissions.includes('full_control') || user.permissions.includes('manage_announcements')) && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleArchive(announcement.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-amber-400 transition-all"
                          title={announcement.isArchived ? 'استعادة' : 'أرشفة'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingAnnouncement(announcement)}
                          className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold">{announcement.title}</h2>
                  <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">{announcement.content}</p>
                  
                  {announcement.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-4">
                      {announcement.attachments.map((file) => (
                        <a 
                          key={file.url} 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded-xl text-xs hover:bg-zinc-700 cursor-pointer transition-colors border border-white/5"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{file.name}</span>
                          <Download className="w-3 h-3 text-zinc-600" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 space-y-4">
                  <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
                    <p className="text-xs text-zinc-500 mb-3">حالة القراءة</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 rtl:space-x-reverse">
                        {announcement.readBy.slice(0, 3).map(uid => {
                          const reader = appData.users.find(u => u.id === uid);
                          return (
                            <div key={uid} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden" title={reader?.name}>
                              {reader?.avatar ? <img src={reader.avatar} alt="" /> : <UserIcon className="w-4 h-4 text-zinc-500" />}
                            </div>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-zinc-400">
                        {announcement.readBy.length} من {appData.users.length}
                      </span>
                    </div>
                  </div>

                  {announcement.type === 'acknowledge' && (
                    <button
                      disabled={announcement.acknowledgedBy.includes(user.id)}
                      onClick={() => handleAcknowledge(announcement.id)}
                      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all ${
                        announcement.acknowledgedBy.includes(user.id)
                          ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                          : 'bg-amber-500 hover:bg-amber-400 text-zinc-900 shadow-lg shadow-amber-900/20 active:scale-95'
                      }`}
                    >
                      {announcement.acknowledgedBy.includes(user.id) ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>تم التأشير بالعلم</span>
                        </>
                      ) : (
                        <span>تأشير بالعلم والإطلاع</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && <CreateAnnouncementModal onClose={() => setIsCreateModalOpen(false)} />}
        
        <ConfirmModal
          isOpen={!!deletingAnnouncement}
          onClose={() => setDeletingAnnouncement(null)}
          onConfirm={handleDelete}
          title="تأكيد حذف الإعلان"
          message={`هل أنت متأكد من حذف الإعلان "${deletingAnnouncement?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف الإعلان"
        />
      </AnimatePresence>
    </div>
  );
};
