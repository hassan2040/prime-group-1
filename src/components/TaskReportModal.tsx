import React, { useState } from 'react';
import { Task, Attachment } from '../types';
import { X, Upload, Paperclip, CheckCircle2, Clock, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { db as firestore } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface TaskReportModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskReportModal: React.FC<TaskReportModalProps> = ({ task, onClose }) => {
  const { user } = useAuth();
  const { db: appData, addAuditLog, addNotification, uploadFile } = useAppContext();
  const [content, setContent] = useState('');
  const [actualHours, setActualHours] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!user || !appData) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const uploadedFile = await uploadFile(file);
        setAttachments([...attachments, uploadedFile]);
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const report = {
        userId: user.id,
        userName: user.name,
        content,
        attachments,
        completedAt: new Date().toISOString()
      };

      // Detect mentions in report
      const mentionRegex = /@(\w+)/g;
      const matches = content.match(mentionRegex);
      if (matches) {
        const mentionedUsernames = matches.map(m => m.substring(1));
        const mentionedUsers = appData.users.filter(u => mentionedUsernames.includes(u.username));
        
        mentionedUsers.forEach(u => {
          addNotification({
            userId: u.id,
            title: 'إشارة إليك في تقرير',
            message: `تمت الإشارة إليك في تقرير المهمة: ${task.title}`,
            type: 'task_deadline',
            link: '/tasks'
          });
        });
      }

      const taskRef = doc(firestore, 'tasks', task.id);
      const updates: any = {
        reports: arrayUnion(report),
        actualHours: (task.actualHours || 0) + actualHours
      };

      // If individual task, mark as completed
      if (task.type === 'individual') {
        updates.status = 'completed';
      } else {
        // If group task, check if everyone completed
        // We need to check the latest reports including the one we just added
        const allCompleted = task.assignedTo.every(uid => 
          uid === user.id || task.reports.some(r => r.userId === uid)
        );
        if (allCompleted) {
          updates.status = 'completed';
        }
      }

      await updateDoc(taskRef, updates);
      addAuditLog(user.id, user.name, `أنجز المهمة: ${task.title}`);
      
      // Notify creator
      addNotification({
        userId: task.createdBy,
        title: 'تم إنجاز مهمة',
        message: `قام ${user.name} بإنجاز المهمة: ${task.title}`,
        type: 'task_deadline',
        link: '/tasks'
      });

      onClose();
    } catch (error) {
      console.error('Error submitting task report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">تقرير إنجاز المهمة</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-zinc-400 mr-1">تفاصيل الإنجاز</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none"
              placeholder="اكتب ماذا أنجزت بالتفصيل..."
              required
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 mr-1">الساعات الفعلية المستغرقة</label>
            <div className="relative">
              <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="number"
                value={actualHours}
                onChange={(e) => setActualHours(Number(e.target.value))}
                className="w-full bg-zinc-800/50 border border-white/5 text-white pr-10 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400 mr-1">إرفاق ملفات الإثبات</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file) => (
                <div key={file.url} className="bg-zinc-800 px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-2 border border-white/5">
                  <Paperclip className="w-3 h-3 text-zinc-500" />
                  <span>{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setAttachments(attachments.filter((f) => f.url !== file.url))}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className={`flex flex-col items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input type="file" className="hidden" onChange={handleFileChange} />
              <Upload className={`w-8 h-8 ${isUploading ? 'animate-bounce text-primary' : 'text-zinc-600'}`} />
              <p className="text-xs text-zinc-500">{isUploading ? 'جاري الرفع...' : 'اسحب الملفات هنا أو انقر للرفع'}</p>
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الإنجاز'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
