const fs = require('fs');
const content = `-- Migration 0004: Notifications RC1 (Central Inteligente)
-- Domain: Event -> Rule -> Notification -> Delivery

-- 1. Enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('ALERT', 'COMMUNICATION', 'UPDATE', 'SYSTEM');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_priority') THEN
    CREATE TYPE notification_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'INFO');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_source') THEN
    CREATE TYPE notification_source AS ENUM ('presence', 'employees', 'projects', 'system', 'manual', 'update');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
    CREATE TYPE notification_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_target_type') THEN
    CREATE TYPE notification_target_type AS ENUM ('GLOBAL', 'ROLE', 'PROJECT', 'USER');
  END IF;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'INFO',
  source notification_source NOT NULL DEFAULT 'system',
  status notification_status NOT NULL DEFAULT 'DRAFT',
  target_type notification_target_type NOT NULL DEFAULT 'GLOBAL',
  target_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  requires_acknowledgment BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  publish_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  CONSTRAINT chk_publish_expires CHECK (expires_at IS NULL OR expires_at > publish_at),
  CONSTRAINT chk_target_id CHECK (target_type = 'GLOBAL' OR target_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  PRIMARY KEY (notification_id, user_id)
);

-- 3. Indices
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_publish_at ON notifications(publish_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source);
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);

-- 4. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications" 
ON notifications FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view targeted notifications" ON notifications;
CREATE POLICY "Users can view targeted notifications" 
ON notifications FOR SELECT 
USING (
  status = 'PUBLISHED'
  AND publish_at <= NOW()
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (
    target_type = 'GLOBAL'
    OR (target_type = 'USER' AND target_id = auth.uid())
    OR (target_type = 'ROLE' AND target_id = (SELECT profile_id FROM public.users WHERE id = auth.uid()))
    OR target_type = 'PROJECT'
  )
);

DROP POLICY IF EXISTS "Users can manage their own reads" ON notification_reads;
CREATE POLICY "Users can manage their own reads"
ON notification_reads FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Views
CREATE OR REPLACE VIEW vw_user_notifications AS
SELECT 
  n.id,
  n.type,
  n.priority,
  n.source,
  n.status,
  n.target_type,
  n.target_id,
  n.title,
  n.description,
  n.metadata,
  n.requires_acknowledgment,
  n.is_pinned,
  n.publish_at,
  n.expires_at,
  n.resolved_at,
  n.resolved_by,
  n.created_at,
  n.updated_at,
  n.created_by,
  nr.read_at,
  nr.acknowledged_at,
  COALESCE(nr.read_at IS NOT NULL, FALSE) as is_read,
  COALESCE(nr.acknowledged_at IS NOT NULL, FALSE) as is_acknowledged
FROM notifications n
LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = auth.uid()
WHERE n.status = 'PUBLISHED'
  AND n.publish_at <= NOW()
  AND (n.expires_at IS NULL OR n.expires_at > NOW())
  AND (
    n.target_type = 'GLOBAL'
    OR (n.target_type = 'USER' AND n.target_id = auth.uid())
    OR (n.target_type = 'ROLE' AND n.target_id = (SELECT profile_id FROM public.users WHERE id = auth.uid()))
    OR n.target_type = 'PROJECT'
  );

-- 7. Functions & RPCs
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id, read_at)
  VALUES (p_notification_id, auth.uid(), NOW())
  ON CONFLICT (notification_id, user_id) 
  DO UPDATE SET read_at = NOW() WHERE notification_reads.read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION acknowledge_notification(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id, read_at, acknowledged_at)
  VALUES (p_notification_id, auth.uid(), NOW(), NOW())
  ON CONFLICT (notification_id, user_id) 
  DO UPDATE SET 
    read_at = COALESCE(notification_reads.read_at, NOW()),
    acknowledged_at = NOW()
  WHERE notification_reads.acknowledged_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_reads (notification_id, user_id, read_at)
  SELECT id, auth.uid(), NOW()
  FROM vw_user_notifications
  WHERE is_read = FALSE
  ON CONFLICT (notification_id, user_id) 
  DO UPDATE SET read_at = NOW() WHERE notification_reads.read_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION resolve_notification(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    UPDATE notifications 
    SET resolved_at = NOW(),
        resolved_by = auth.uid()
    WHERE id = p_notification_id AND resolved_at IS NULL;
  ELSE
    RAISE EXCEPTION 'Not authorized to resolve notifications';
  END IF;
END;
$$;

-- 8. Triggers
DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notifications_audit ON notifications;
CREATE TRIGGER trg_notifications_audit
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- 9. Realtime Configuration
-- Note: Supabase publications don't have a simple "IF NOT EXISTS", 
-- but doing it multiple times shouldn't break or we can wrap it.
DO $$
BEGIN
  -- Re-add tables to publication safely
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notification_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notification_reads;
  END IF;
END $$;
\`;
fs.writeFileSync('supabase/migrations/0004_notifications_rc1.sql', content);
