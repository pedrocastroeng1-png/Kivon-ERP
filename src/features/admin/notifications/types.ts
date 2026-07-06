export type NotificationType = 'ALERT' | 'COMMUNICATION' | 'UPDATE' | 'SYSTEM';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type NotificationSource = 'presence' | 'employees' | 'projects' | 'system' | 'manual' | 'update';
export type NotificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELED';
export type NotificationTargetType = 'GLOBAL' | 'ROLE' | 'PROJECT' | 'USER';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  source: NotificationSource;
  status: NotificationStatus;
  target_type: NotificationTargetType;
  target_id: string | null;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  requires_acknowledgment: boolean;
  is_pinned: boolean;
  publish_at: string | null;
  expires_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator_name?: string; // For UI display
  resolver_name?: string; // For UI display
  read_count?: number; // Added conceptually for detail view stats
  ack_count?: number; // Added conceptually for detail view stats
}

export interface NotificationStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  critical: number;
  unread: number; // This might be hard to calculate per admin, maybe meaning 'not fully read by all'? Or just global count. 
}

export interface NotificationFilters {
  status?: NotificationStatus;
  priority?: NotificationPriority;
  type?: NotificationType;
  target_type?: NotificationTargetType;
  source?: NotificationSource;
  search?: string;
  publishDateStart?: string;
  publishDateEnd?: string;
  expiresDateStart?: string;
  expiresDateEnd?: string;
}
