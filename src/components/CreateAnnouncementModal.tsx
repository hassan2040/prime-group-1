import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Megaphone, Paperclip, Plus, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Announcement } from '../types';
import { db as firestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CreateAnnouncementModalProps {
  onClose: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ onClose }) => {
  const { db: appData, addAuditLog, uploadFile } = useAppContext();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'general' | 'acknowledge'>('general');
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!appData || !user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const uploaded = await uploadFile(file);
        setAttachments([...attachments, uploaded]);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const newAnnouncement: Announcement = {
        id,
        title,
        content,
        type,
        attachments,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        readBy: [user.id],
        acknowledgedBy: type === 'acknowledge' ? [user.id] : [],
        isArchived: false
      };

      await setDoc(doc(firestore, 'announcements', id), newAnnouncement);
      addAuditLog(user.id, user.name, `نشر إعلاناً جديداً: ${title}`);
      
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">نشر إعلان أو قرار جديد</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X className="w-6 h-6 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 mr-1">عنوان الإعلان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="عنوان موجز وواضح"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 mr-1">محتوى الإعلان</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px] resize-none transition-all"
                placeholder="اكتب تفاصيل الإعلان هنا..."
                required
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 mr-1">نوع الإعلان</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('general')}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${type === 'general' ? 'bg-primary text-white shadow-lg shadow-primary' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  إعلان عام
                </button>
                <button
                  type="button"
                  onClick={() => setType('acknowledge')}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${type === 'acknowledge' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  يتطلب تأشير بالعلم
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 mr-1">المرفقات</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((file) => (
                  <div key={file.url} className="bg-zinc-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2 border border-white/5">
                    <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setAttachments(attachments.filter((a) => a.url !== file.url))}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <label className={`flex items-center justify-center gap-2 w-full py-5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" className="hidden" onChange={handleFileChange} />
                <Plus className="w-5 h-5 text-zinc-500" />
                <span className="text-sm font-bold text-zinc-500">{isUploading ? 'جاري الرفع...' : 'إضافة مرفق'}</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={!title || !content || isUploading}
              className="px-12 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              نشر الإعلان
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
