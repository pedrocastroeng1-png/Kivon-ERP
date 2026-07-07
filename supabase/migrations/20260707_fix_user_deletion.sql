-- Fix foreign keys to allow user deletion while preserving historical data

DO $$
DECLARE
    r record;
BEGIN
    -- Drop existing foreign keys for public.users.id
    FOR r IN
        SELECT constraint_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
          AND constraint_name IN (SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY')
    LOOP
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
    
    -- Drop existing foreign keys for public.presence_photos.captured_by
    FOR r IN
        SELECT constraint_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public' AND table_name = 'presence_photos' AND column_name = 'captured_by'
          AND constraint_name IN (SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY')
    LOOP
        EXECUTE 'ALTER TABLE public.presence_photos DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Drop existing foreign keys for public.presence.registered_by
    FOR r IN
        SELECT constraint_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public' AND table_name = 'presence' AND column_name = 'registered_by'
          AND constraint_name IN (SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY')
    LOOP
        EXECUTE 'ALTER TABLE public.presence DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END
$$;

-- 1. Alter public.users to cascade delete when auth.users is deleted
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Alter public.presence_photos to set null when user is deleted
ALTER TABLE public.presence_photos ALTER COLUMN captured_by DROP NOT NULL;
ALTER TABLE public.presence_photos ADD CONSTRAINT presence_photos_captured_by_fkey 
  FOREIGN KEY (captured_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Alter public.presence to set null when user is deleted
ALTER TABLE public.presence ALTER COLUMN registered_by DROP NOT NULL;
ALTER TABLE public.presence ADD CONSTRAINT presence_registered_by_fkey 
  FOREIGN KEY (registered_by) REFERENCES public.users(id) ON DELETE SET NULL;
