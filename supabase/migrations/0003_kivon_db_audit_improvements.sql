-- KIVON ERP - Migration V3 (DB Audit & Improvements)

-- 1. Create presence_status ENUM
CREATE TYPE public.presence_status AS ENUM ('PRESENTE', 'FALTOU', 'ATESTADO', 'FERIAS', 'FOLGA');

-- 2. Alter presence table to add status and presence_time
ALTER TABLE public.presence ADD COLUMN status public.presence_status NOT NULL DEFAULT 'PRESENTE';
ALTER TABLE public.presence ADD COLUMN presence_time time;

-- Update vw_presenca_hoje to include new columns
DROP VIEW IF EXISTS public.vw_presenca_hoje;
CREATE OR REPLACE VIEW public.vw_presenca_hoje
WITH (security_invoker = true) AS
SELECT
  pr.id,
  pr.project_id,
  pj.name AS project_name,
  pr.employee_id,
  e.full_name AS employee_name,
  pr.shift,
  pr.presence_date,
  pr.presence_time,
  pr.status,
  pr.photo_id,
  pr.registered_by,
  u.full_name AS registered_by_name,
  pr.registered_at
FROM public.presence pr
JOIN public.projects pj ON pj.id = pr.project_id
JOIN public.employees e ON e.id = pr.employee_id
JOIN public.users u ON u.id = pr.registered_by
WHERE pr.active = true
  AND pr.presence_date = current_date;

-- Update vw_total_diarias to only count 'PRESENTE'
DROP VIEW IF EXISTS public.vw_total_diarias;
CREATE OR REPLACE VIEW public.vw_total_diarias
WITH (security_invoker = true) AS
SELECT
  pr.project_id,
  pj.name AS project_name,
  pr.employee_id,
  e.full_name AS employee_name,
  pr.presence_date,
  count(*) FILTER (WHERE pr.active = true AND pr.status = 'PRESENTE') * 0.5::numeric AS total_diarias,
  jr.daily_rate,
  (count(*) FILTER (WHERE pr.active = true AND pr.status = 'PRESENTE') * 0.5::numeric) * jr.daily_rate AS total_valor
FROM public.presence pr
JOIN public.projects pj ON pj.id = pr.project_id
JOIN public.employees e ON e.id = pr.employee_id
JOIN public.job_roles jr ON jr.id = e.job_role_id
GROUP BY pr.project_id, pj.name, pr.employee_id, e.full_name, pr.presence_date, jr.daily_rate;

-- Update `calcular_diaria` RPC to only count 'PRESENTE'
CREATE OR REPLACE FUNCTION public.calcular_diaria(
  p_employee_id uuid,
  p_presence_date date
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_rate numeric;
  v_shifts_count integer;
BEGIN
  -- Get employee's daily rate
  SELECT jr.daily_rate INTO v_daily_rate
  FROM public.employees e
  JOIN public.job_roles jr ON jr.id = e.job_role_id
  WHERE e.id = p_employee_id;

  IF v_daily_rate IS NULL THEN
    RETURN 0;
  END IF;

  -- Count shifts
  SELECT count(*) INTO v_shifts_count
  FROM public.presence
  WHERE employee_id = p_employee_id
    AND presence_date = p_presence_date
    AND status = 'PRESENTE'
    AND active = true;

  -- 0.5 per shift
  RETURN (v_shifts_count * 0.5) * v_daily_rate;
END;
$$;

-- 3. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_presence_status ON public.presence (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON public.audit_logs (operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);

-- Update registrar_presenca RPC
DROP FUNCTION IF EXISTS public.registrar_presenca(uuid, uuid, date, public.shift_type, uuid);
CREATE OR REPLACE FUNCTION public.registrar_presenca(
  p_project_id uuid,
  p_employee_id uuid,
  p_presence_date date,
  p_shift public.shift_type,
  p_photo_id uuid DEFAULT null,
  p_status public.presence_status DEFAULT 'PRESENTE',
  p_presence_time time DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_presence_id uuid;
  v_photo_required boolean := false;
  v_existing_photo_id uuid;
BEGIN
  -- Validate active assignment
  IF NOT EXISTS (
    SELECT 1 FROM public.project_employees
    WHERE project_id = p_project_id
      AND employee_id = p_employee_id
      AND active = true
      AND assigned_at <= p_presence_date
      AND (unassigned_at IS NULL OR unassigned_at >= p_presence_date)
  ) THEN
    RAISE EXCEPTION 'Funcionario nao esta alocado ativamente nesta obra para a data especificada.';
  END IF;

  -- Photo requirement for morning shift (only if PRESENTE)
  IF p_status = 'PRESENTE' AND p_shift = 'manha'::public.shift_type THEN
    -- Check if there's already a photo for this employee/project/date
    SELECT id INTO v_existing_photo_id
    FROM public.presence_photos
    WHERE employee_id = p_employee_id
      AND project_id = p_project_id
      AND presence_date = p_presence_date
      AND active = true
    LIMIT 1;

    IF v_existing_photo_id IS NULL AND p_photo_id IS NULL THEN
      RAISE EXCEPTION 'Foto obrigatoria para o primeiro registro da manha.';
    END IF;

    IF p_photo_id IS NULL THEN
      p_photo_id := v_existing_photo_id;
    END IF;
  ELSE
    -- Afternoon shift or non-present status doesn't require photo
    IF p_photo_id IS NULL AND p_status = 'PRESENTE' THEN
       SELECT id INTO p_photo_id
        FROM public.presence_photos
        WHERE employee_id = p_employee_id
          AND project_id = p_project_id
          AND presence_date = p_presence_date
          AND active = true
        LIMIT 1;
    END IF;
    
    -- If they are not 'PRESENTE', photo is not required
    IF p_status != 'PRESENTE' THEN
       p_photo_id := NULL;
    END IF;
  END IF;

  -- Insert presence
  INSERT INTO public.presence (
    project_id,
    employee_id,
    shift,
    presence_date,
    presence_time,
    status,
    photo_id,
    registered_by
  ) VALUES (
    p_project_id,
    p_employee_id,
    p_shift,
    p_presence_date,
    COALESCE(p_presence_time, current_time),
    p_status,
    p_photo_id,
    auth.uid()
  ) RETURNING id INTO v_presence_id;

  RETURN v_presence_id;
END;
$$;
