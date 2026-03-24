import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Plus, User as UserIcon, Calendar, Flag, FileText, Search, Clock, ListTodo } from 'lucide-react';
import { motion } from 'motion/react';
import { Task } from '../types';

interface CreateTaskModalProps {
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose }) => {
  const { db, updateDB, addAuditLog, addNotification, uploadFile } = useAppContext();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [type, setType] = useState<'individual' | 'group'>('individual');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  if (!db || !user) return null;

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
    
    // Create subtasks first
    const createdSubtasks: Task[] = subtaskTitles.map(stTitle => ({
      id: Math.random().toString(36).substr(2, 9),
      title: stTitle,
      description: `مهمة فرعية لـ: ${title}`,
      assignedTo,
      type: 'individual',
      deadline,
      status: 'new',
      priority,
      attachments: [],
      mentions: [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      reports: []
    }));

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      assignedTo,
      type,
      deadline,
      status: 'new',
      priority,
      estimatedHours,
      actualHours: 0,
      subtasks: createdSubtasks.map(st => st.id),
      attachments,
      mentions: [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      reports: []
    };

    // Detect mentions
    const mentionRegex = /@(\w+)/g;
    const matches = description.match(mentionRegex);
    if (matches) {
      const mentionedUsernames = matches.map(m => m.substring(1));
      const mentionedUsers = db.users.filter(u => mentionedUsernames.includes(u.username));
      newTask.mentions = mentionedUsers.map(u => u.id);
      
      // Notify mentioned users
      mentionedUsers.forEach(u => {
        if (!assignedTo.includes(u.id)) { // Don't notify twice if they are already assigned
          addNotification({
            userId: u.id,
            title: 'إشارة إليك',
            message: `تمت الإشارة إليك في المهمة: ${title}`,
            type: 'task_deadline',
            link: '/tasks'
          });
        }
      });
    }

    const newDB = { ...db, tasks: [...createdSubtasks, newTask, ...db.tasks] };
    await updateDB(newDB);
    addAuditLog(user.id, user.name, `أنشأ مهمة جديدة: ${title}`);
    
    // Notify assignees
    assignedTo.forEach(uid => {
      addNotification({
        userId: uid,
        title: 'مهمة جديدة',
        message: `تم تكليفك بمهمة جديدة: ${title}`,
        type: 'task_deadline',
        link: '/tasks'
      });
    });

    onClose();
  };

  const filteredEmployees = db.users.filter(u => 
    u.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
    u.username.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtaskTitles([...subtaskTitles, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const toggleAssignee = (uid: string) => {
    if (assignedTo.includes(uid)) {
      setAssignedTo(assignedTo.filter(id => id !== uid));
    } else {
      if (type === 'individual') {
        setAssignedTo([uid]);
      } else {
        setAssignedTo([...assignedTo, uid]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">إنشاء مهمة جديدة</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">عنوان المهمة</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ما هي المهمة؟"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">وصف المهمة</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none"
                  placeholder="تفاصيل أكثر عن المطلوب..."
                  required
                ></textarea>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 mr-1">الموعد النهائي</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400 mr-1">الساعات المقدرة</label>
                    <div className="relative">
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="number"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(Number(e.target.value))}
                        className="w-full bg-zinc-800/50 border border-white/5 text-white pr-10 pl-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 mr-1">الأولوية</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-zinc-800/50 border border-white/5 text-white px-5 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجل جداً</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400 mr-1">المهام الفرعية</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                      className="flex-1 bg-zinc-800/50 border border-white/5 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      placeholder="إضافة مهمة فرعية..."
                    />
                    <button 
                      type="button"
                      onClick={addSubtask}
                      className="bg-zinc-800 text-white p-3 rounded-xl hover:bg-zinc-700 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {subtaskTitles.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <ListTodo className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm">{st}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setSubtaskTitles(subtaskTitles.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">نوع المهمة</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setType('individual'); setAssignedTo([]); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'individual' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    فردية
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('group'); setAssignedTo([]); }}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'group' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-500'}`}
                  >
                    جماعية
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-400 mr-1">المرفقات</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="bg-zinc-800 px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-2 border border-white/5">
                      <FileText className="w-3 h-3 text-zinc-500" />
                      <span>{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                  <Plus className="w-5 h-5 text-zinc-500" />
                  <span className="text-sm text-zinc-500">{isUploading ? 'جاري الرفع...' : 'إضافة مرفق'}</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm text-zinc-400 mr-1">تكليف الموظفين</label>
              <div className="relative mb-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  placeholder="بحث عن موظف..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/5 text-white pr-9 pl-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="bg-zinc-800/30 border border-white/5 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                {filteredEmployees.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-white/5 transition-all text-right ${
                      assignedTo.includes(u.id) ? 'bg-primary-light' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      assignedTo.includes(u.id) ? 'bg-primary border-primary' : 'border-zinc-700'
                    }`}>
                      {assignedTo.includes(u.id) && <X className="w-3 h-3 text-white" />}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden">
                      {u.avatar ? <img src={u.avatar} alt="" /> : <UserIcon className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{u.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{db.roles.find(r => r.id === u.roleId)?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
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
              disabled={assignedTo.length === 0 || !title}
              className="px-12 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-primary transition-all active:scale-95 disabled:opacity-50"
            >
              إنشاء المهمة
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
