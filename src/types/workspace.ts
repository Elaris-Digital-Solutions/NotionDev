export type PageType = 'blank' | 'database' | 'template';

export type ViewType = 'table' | 'list' | 'kanban' | 'calendar' | 'gallery';

export type Status = 'not-started' | 'in-progress' | 'completed' | 'blocked';

export type Priority = 'high' | 'medium' | 'low';

export interface Page {
  id: string;
  title: string;
  icon?: string | null;
  cover_image?: string | null;
  parent_id?: string | null;
  team_space_id?: string | null;
  owner_id: string;
  type: PageType;
  is_database: boolean;
  position: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  blocks?: Block[];
}

export interface TeamSpace {
  id: string;
  name: string;
  icon?: string | null;
  pages: Page[];
  members?: TeamSpaceMember[];
}

export interface TeamSpaceMember {
  id: string;
  team_space_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  user?: { email: string }; // Joined user data
}

export interface PagePermission {
  id: string;
  page_id: string;
  user_id: string;
  role: 'full_access' | 'can_edit' | 'can_comment' | 'can_view';
  user?: { email: string };
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
  type: 'mention' | 'assignment' | 'status-change' | 'comment' | 'info';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants?: string[];
  notes?: string;
  created_at: string;
}

export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet-list' | 'numbered-list' | 'todo' | 'quote' | 'toggle' | 'image' | 'video' | 'bookmark' | 'code' | 'callout' | 'divider';

export interface Block {
  id: string;
  type: string;
  content: any; // Changed from string | null to support Tiptap JSON
  plain_text?: string;
  version: number;
  properties: any;
  order: number;
  position: number;
  deleted_at?: string | null;
  parent_block_id: string | null;
  children?: Block[];
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'status' | 'priority' | 'date' | 'person' | 'files' | 'checkbox' | 'url' | 'email' | 'phone';
  options?: any[];
  config?: any; // e.g. { options: [{ id, name, color }] }
  position: number;
}
