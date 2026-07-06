ALTER TABLE public.users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT true;
