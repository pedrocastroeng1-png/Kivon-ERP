-- KIVON ERP - Migration V2
-- Business logic, RPCs, and missing columns.

-- 1. Missing columns
alter table public.job_roles add column if not exists description text;
alter table public.projects add column if not exists city text;
alter table public.projects add column if not exists client_name text;
alter table public.employees add column if not exists avatar_url text;

-- 2. Audit Trigger Function
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_old_data jsonb := null;
  v_new_data jsonb := null;
  v_record_id uuid;
begin
  v_user_id := auth.uid();
  
  if tg_op = 'INSERT' then
    v_new_data := to_jsonb(new);
    v_record_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
    v_record_id := new.id;
  elsif tg_op = 'DELETE' then
    v_old_data := to_jsonb(old);
    v_record_id := old.id;
  end if;

  insert into public.audit_logs (
    table_name,
    record_id,
    operation,
    changed_by,
    old_data,
    new_data
  ) values (
    tg_table_name::text,
    v_record_id,
    lower(tg_op)::public.audit_operation,
    v_user_id,
    v_old_data,
    v_new_data
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Apply audit triggers to tables
create trigger trg_job_roles_audit after insert or update or delete on public.job_roles for each row execute function public.registrar_auditoria();
create trigger trg_projects_audit after insert or update or delete on public.projects for each row execute function public.registrar_auditoria();
create trigger trg_employees_audit after insert or update or delete on public.employees for each row execute function public.registrar_auditoria();
create trigger trg_project_employees_audit after insert or update or delete on public.project_employees for each row execute function public.registrar_auditoria();
create trigger trg_presence_audit after insert or update or delete on public.presence for each row execute function public.registrar_auditoria();

-- 3. registrar_presenca RPC
create or replace function public.registrar_presenca(
  p_project_id uuid,
  p_employee_id uuid,
  p_presence_date date,
  p_shift public.shift_type,
  p_photo_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_presence_id uuid;
  v_photo_required boolean := false;
  v_existing_photo_id uuid;
begin
  -- Validate active assignment
  if not exists (
    select 1 from public.project_employees
    where project_id = p_project_id
      and employee_id = p_employee_id
      and active = true
      and assigned_at <= p_presence_date
      and (unassigned_at is null or unassigned_at >= p_presence_date)
  ) then
    raise exception 'Funcionario nao esta alocado ativamente nesta obra para a data especificada.';
  end if;

  -- Photo requirement for morning shift
  if p_shift = 'manha'::public.shift_type then
    -- Check if there's already a photo for this employee/project/date
    select id into v_existing_photo_id
    from public.presence_photos
    where employee_id = p_employee_id
      and project_id = p_project_id
      and presence_date = p_presence_date
      and active = true
    limit 1;

    if v_existing_photo_id is null and p_photo_id is null then
      raise exception 'Foto obrigatoria para o primeiro registro da manha.';
    end if;

    if p_photo_id is null then
      p_photo_id := v_existing_photo_id;
    end if;
  else
    -- Afternoon shift doesn't require photo, but can link to the morning one if exists
    if p_photo_id is null then
       select id into p_photo_id
        from public.presence_photos
        where employee_id = p_employee_id
          and project_id = p_project_id
          and presence_date = p_presence_date
          and active = true
        limit 1;
    end if;
  end if;

  -- Insert presence
  insert into public.presence (
    project_id,
    employee_id,
    shift,
    presence_date,
    photo_id,
    registered_by
  ) values (
    p_project_id,
    p_employee_id,
    p_shift,
    p_presence_date,
    p_photo_id,
    auth.uid()
  ) returning id into v_presence_id;

  return v_presence_id;
end;
$$;

-- 4. calcular_diaria RPC
create or replace function public.calcular_diaria(
  p_employee_id uuid,
  p_presence_date date
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daily_rate numeric;
  v_shifts_count integer;
begin
  -- Get employee's daily rate
  select jr.daily_rate into v_daily_rate
  from public.employees e
  join public.job_roles jr on jr.id = e.job_role_id
  where e.id = p_employee_id;

  if v_daily_rate is null then
    return 0;
  end if;

  -- Count shifts
  select count(*) into v_shifts_count
  from public.presence
  where employee_id = p_employee_id
    and presence_date = p_presence_date
    and active = true;

  -- 0.5 per shift
  return (v_shifts_count * 0.5) * v_daily_rate;
end;
$$;

-- Trigger to prevent physical deletion of projects and employees
create or replace function public.prevent_deletion()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Exclusao fisica nao permitida. Use inativacao logica (active = false).';
end;
$$;

create trigger trg_prevent_del_projects before delete on public.projects for each row execute function public.prevent_deletion();
create trigger trg_prevent_del_employees before delete on public.employees for each row execute function public.prevent_deletion();
create trigger trg_prevent_del_job_roles before delete on public.job_roles for each row execute function public.prevent_deletion();
