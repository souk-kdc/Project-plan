export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'delayed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ResourceType = 'work' | 'material' | 'cost';

export interface Resource {
  id: string;
  name: string;
  role: string;
  email: string;
  type: ResourceType;
  capacity: number; // e.g., 100 for 100%
  hourlyRate: number; // in USD or Kip
  avatarColor: string;
}

export interface Task {
  id: string;
  wbs: string; // e.g. "1", "1.1", "1.2", "2"
  name: string;
  parentId: string | null;
  indent: number; // 0, 1, 2, ...
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // in days
  progress: number; // 0 - 100 (%)
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  predecessors: string[]; // Task IDs or WBS codes
  notes?: string;
  isMilestone?: boolean;
  isSummary?: boolean; // automatically true if has children
  collapsed?: boolean;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  lastSyncedAt?: string;
  autoSync?: boolean;
}

export interface DriveSheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export type ViewMode = 'gantt' | 'sheet' | 'resources' | 'board' | 'summary';
export type Language = 'lo' | 'en';
