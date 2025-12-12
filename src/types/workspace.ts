export type PageType = 'blank' | 'database' | 'template';

export type ViewType = 'table' | 'list' | 'kanban' | 'calendar' | 'gallery';

export type Status = 'not-started' | 'in-progress' | 'completed' | 'blocked';

export type Priority = 'high' | 'medium' | 'low';

export interface Page {
  id: string;
  title: string;
  icon?: string;
  parentId?: string;
  type: PageType;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSpace {
  id: string;
  name: string;
  icon?: string;
  pages: Page[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignee?: string;
  dueDate?: Date;
  progress: number;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  problem?: string;
  status: Status;
  priority: Priority;
  progress: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'status-change' | 'comment';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  attendees: string[];
  notes?: string;
}
