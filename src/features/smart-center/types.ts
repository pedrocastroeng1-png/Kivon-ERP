export type NotificationType = 'ALERT' | 'COMMUNICATION' | 'UPDATE' | 'SYSTEM';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type NotificationSource = 'presence' | 'employees' | 'projects' | 'system' | 'manual' | 'update';
export type NotificationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELED';
export type NotificationTargetType = 'GLOBAL' | 'ROLE' | 'PROJECT' | 'USER';

export interface NotificationMetadata {
  projectId?: string;
  employeeId?: string;
  version?: string;
  releaseNotesId?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  source: NotificationSource;
  status: NotificationStatus;
  target_type: NotificationTargetType;
  target_id?: string | null;
  title: string;
  description: string;
  metadata?: NotificationMetadata;
  requires_acknowledgment: boolean;
  is_pinned: boolean;
  publish_at: string;
  expires_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  read_at?: string | null;
  acknowledged_at?: string | null;
  is_read: boolean;
  is_acknowledged: boolean;
}
