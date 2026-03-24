export type Permission = 
  | 'full_control'
  | 'create_tasks'
  | 'edit_tasks'
  | 'delete_tasks'
  | 'create_announcements'
  | 'edit_announcements'
  | 'delete_announcements'
  | 'manage_announcements'
  | 'manage_employees'
  | 'manage_permissions'
  | 'manage_settings'
  | 'view_performance'
  | 'view_all_tasks'
  | 'view_only';

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
  name: string;
  roleId: string;
  departmentId?: string;
  permissions: Permission[];
  status: 'active' | 'inactive';
  joinedDate: string;
  avatar: string | null;
  managerId?: string;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  parentId?: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[]; // User IDs
  type: 'individual' | 'group';
  deadline: string;
  status: 'new' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  attachments: Attachment[];
  mentions: string[]; // User IDs
  createdBy: string;
  createdAt: string;
  reports: TaskReport[];
  estimatedHours?: number;
  actualHours?: number;
  subtasks?: string[]; // Task IDs
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface TaskReport {
  userId: string;
  userName: string;
  content: string;
  attachments: Attachment[];
  completedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'acknowledge';
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
  readBy: string[]; // User IDs
  acknowledgedBy: string[]; // User IDs
  isArchived: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_deadline' | 'task_delayed' | 'mention' | 'new_announcement';
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  logo: string | null;
  onboarded: boolean;
  loginTitle?: string;
  loginSubtitle?: string;
  loginBg?: string;
  primaryColor?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface DB {
  company: CompanySettings;
  users: User[];
  roles: Role[];
  departments: Department[];
  tasks: Task[];
  announcements: Announcement[];
  notifications: Notification[];
  auditLog: AuditLog[];
}
