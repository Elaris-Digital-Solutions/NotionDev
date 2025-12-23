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
  type: PageType;
  created_at: string;
  updated_at: string;
  blocks?: Block[];
  team_space_id: string | null;
  owner_id: string;
  is_favorite?: boolean;
  is_database?: boolean;
  position?: number;
  parent_database_id?: string | null;
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
  type: 'mention' | 'assignment' | 'status-change' | 'comment';
  title: string;
  message: string;
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

export type BlockType =
  | 'text'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'to_do'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet-list'
  | 'numbered-list'
  | 'todo'
  | 'quote'
  | 'toggle'
  | 'image'
  | 'video'
  | 'bookmark'
  | 'code'
  | 'callout'
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string | null;
  properties: Record<string, any>;
  order: number;
  parent_block_id: string | null;
  children?: Block[];
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'status' | 'date' | 'person' | 'files' | 'checkbox' | 'url' | 'email' | 'phone';
  options?: any[];
  config?: any;
  position?: number;
}

export interface DatabaseProperty {
  id: string;
  database_id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multi_select' | 'status' | 'date' | 'person' | 'files' | 'checkbox' | 'url' | 'email' | 'phone';
  options?: any[];
  order: number;
}

export interface PagePropertyValue {
  id: string;
  page_id: string;
  property_id: string;
  value: any;
}

export interface Database {
  id: string;
  page_id: string;
  description?: string;
  created_at: string;
}
