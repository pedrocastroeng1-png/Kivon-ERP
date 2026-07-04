-- KIVON ERP - Database foundation V1
-- Business rules live in PostgreSQL/Supabase. Frontend consumes safe views/RPCs.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'operador');
create type public.shift_type as enum ('manha', 'tarde');
create type public.audit_operation as enum ('insert', 'update', 'delete');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role not null unique,
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_not_blank check (length(trim(name)) > 0)
);

create table public.users (
  id uuid primary key references auth.users(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_full_name_not_blank check (length(trim(full_name)) > 0)
);

create table public.job_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  daily_rate numeric(12, 2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_roles_name_not_blank check (length(trim(name)) > 0),
  constraint job_roles_daily_rate_non_negative check (daily_rate >= 0)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  address text,
  started_at date,
  finished_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_not_blank check (length(trim(name)) > 0),
  constraint projects_date_range check (finished_at is null or started_at is null or finished_at >= started_at)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  job_role_id uuid not null references public.job_roles(id) on delete restrict,
  full_name text not null,
  document_number text unique,
  phone text,
  admission_date date,
  termination_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_full_name_not_blank check (length(trim(full_name)) > 0),
  constraint employees_date_range check (
    termination_date is null
    or admission_date is null
    or termination_date >= admission_date
  )
);

create table public.project_employees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  assigned_at date not null default current_date,
  unassigned_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_employees_unique_assignment unique (project_id, employee_id),
  constraint project_employees_date_range check (unassigned_at is null or unassigned_at >= assigned_at)
);

create table public.presence_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  presence_date date not null,
  captured_by uuid not null references public.users(id) on delete restrict,
  captured_at timestamptz not null default now(),
  storage_bucket text not null default 'presence-photos',
  storage_path text not null unique,
  mime_type text,
  file_size_bytes integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presence_photos_bucket check (storage_bucket = 'presence-photos'),
  constraint presence_photos_path_not_blank check (length(trim(storage_path)) > 0),
  constraint presence_photos_file_size_positive check (file_size_bytes is null or file_size_bytes > 0),
  constraint presence_photos_one_per_employee_project_date unique (employee_id, project_id, presence_date)
);

create table public.presence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  shift public.shift_type not null,
  presence_date date not null,
  photo_id uuid references public.presence_photos(id) on delete restrict,
  registered_by uuid not null references public.users(id) on delete restrict,
  registered_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presence_unique_shift unique (employee_id, project_id, presence_date, shift)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  operation public.audit_operation not null,
  changed_by uuid references public.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audit_logs_table_name_not_blank check (length(trim(table_name)) > 0)
);

insert into public.profiles (code, name, description)
values
  ('admin', 'Administrador', 'Acesso completo ao ERP KIVON.'),
  ('operador', 'Operador', 'Acesso restrito ao cadastro de diarias.')
on conflict (code) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_profile()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.code
  from public.users u
  join public.profiles p on p.id = u.profile_id
  where u.id = auth.uid()
    and u.active = true
    and p.active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_profile() = 'admin'::public.app_role;
$$;

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_profile() = 'operador'::public.app_role;
$$;

-- Planned RPC contracts. Business logic will be implemented in future migrations.
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
begin
  raise exception 'registrar_presenca() ainda sera implementada em migracao futura.';
end;
$$;

create or replace function public.calcular_diaria(
  p_employee_id uuid,
  p_presence_date date
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'calcular_diaria() ainda sera implementada em migracao futura.';
end;
$$;

create or replace function public.obter_funcionarios_da_obra(p_project_id uuid)
returns table (
  employee_id uuid,
  full_name text,
  job_role_name text,
  daily_rate numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.full_name,
    jr.name,
    jr.daily_rate
  from public.project_employees pe
  join public.employees e on e.id = pe.employee_id
  join public.job_roles jr on jr.id = e.job_role_id
  where pe.project_id = p_project_id
    and pe.active = true
    and e.active = true
    and jr.active = true
  order by e.full_name asc;
$$;

create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'registrar_auditoria() sera completada em migracao futura.';
end;
$$;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger trg_job_roles_updated_at
before update on public.job_roles
for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger trg_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger trg_project_employees_updated_at
before update on public.project_employees
for each row execute function public.set_updated_at();

create trigger trg_presence_photos_updated_at
before update on public.presence_photos
for each row execute function public.set_updated_at();

create trigger trg_presence_updated_at
before update on public.presence
for each row execute function public.set_updated_at();

create trigger trg_audit_logs_updated_at
before update on public.audit_logs
for each row execute function public.set_updated_at();

create index idx_profiles_code on public.profiles (code);
create index idx_users_profile_id on public.users (profile_id);
create index idx_users_active on public.users (active);
create index idx_job_roles_active_name on public.job_roles (active, name);
create index idx_projects_active_name on public.projects (active, name);
create index idx_projects_code on public.projects (code);
create index idx_employees_active_name on public.employees (active, full_name);
create index idx_employees_job_role_id on public.employees (job_role_id);
create index idx_project_employees_project_active on public.project_employees (project_id, active);
create index idx_project_employees_employee_active on public.project_employees (employee_id, active);
create index idx_presence_project_date on public.presence (project_id, presence_date);
create index idx_presence_employee_date on public.presence (employee_id, presence_date);
create index idx_presence_date_shift on public.presence (presence_date, shift);
create index idx_presence_registered_by on public.presence (registered_by);
create index idx_presence_photos_employee_date on public.presence_photos (employee_id, presence_date);
create index idx_presence_photos_project_date on public.presence_photos (project_id, presence_date);
create index idx_presence_photos_captured_by on public.presence_photos (captured_by);
create index idx_audit_logs_table_record on public.audit_logs (table_name, record_id);
create index idx_audit_logs_changed_by on public.audit_logs (changed_by);
create index idx_audit_logs_changed_at on public.audit_logs (changed_at desc);

create or replace view public.vw_funcionarios_ativos
with (security_invoker = true) as
select
  e.id,
  e.full_name,
  e.document_number,
  e.phone,
  e.admission_date,
  jr.id as job_role_id,
  jr.name as job_role_name,
  jr.daily_rate
from public.employees e
join public.job_roles jr on jr.id = e.job_role_id
where e.active = true
  and jr.active = true
order by e.full_name asc;

create or replace view public.vw_obras_ativas
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.code,
  p.address,
  p.started_at,
  p.finished_at
from public.projects p
where p.active = true
order by p.name asc;

create or replace view public.vw_presenca_hoje
with (security_invoker = true) as
select
  pr.id,
  pr.project_id,
  pj.name as project_name,
  pr.employee_id,
  e.full_name as employee_name,
  pr.shift,
  pr.presence_date,
  pr.photo_id,
  pr.registered_by,
  u.full_name as registered_by_name,
  pr.registered_at
from public.presence pr
join public.projects pj on pj.id = pr.project_id
join public.employees e on e.id = pr.employee_id
join public.users u on u.id = pr.registered_by
where pr.active = true
  and pr.presence_date = current_date;

create or replace view public.vw_total_diarias
with (security_invoker = true) as
select
  pr.project_id,
  pj.name as project_name,
  pr.employee_id,
  e.full_name as employee_name,
  pr.presence_date,
  count(*) filter (where pr.active = true) * 0.5::numeric as total_diarias,
  jr.daily_rate,
  (count(*) filter (where pr.active = true) * 0.5::numeric) * jr.daily_rate as total_valor
from public.presence pr
join public.projects pj on pj.id = pr.project_id
join public.employees e on e.id = pr.employee_id
join public.job_roles jr on jr.id = e.job_role_id
group by pr.project_id, pj.name, pr.employee_id, e.full_name, pr.presence_date, jr.daily_rate;

create or replace view public.vw_fotos_presenca
with (security_invoker = true) as
select
  pp.id,
  pp.project_id,
  pj.name as project_name,
  pp.employee_id,
  e.full_name as employee_name,
  pp.presence_date,
  pp.captured_by,
  u.full_name as captured_by_name,
  pp.captured_at,
  pp.storage_bucket,
  pp.storage_path,
  pp.mime_type,
  pp.file_size_bytes
from public.presence_photos pp
join public.projects pj on pj.id = pp.project_id
join public.employees e on e.id = pp.employee_id
join public.users u on u.id = pp.captured_by
where pp.active = true;

alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.job_roles enable row level security;
alter table public.projects enable row level security;
alter table public.employees enable row level security;
alter table public.project_employees enable row level security;
alter table public.presence_photos enable row level security;
alter table public.presence enable row level security;
alter table public.audit_logs enable row level security;

create policy "admin_select_profiles" on public.profiles
for select to authenticated
using (public.is_admin());

create policy "admin_manage_profiles" on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users_read_own_user" on public.users
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "admin_manage_users" on public.users
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin_manage_job_roles" on public.job_roles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admin_manage_projects" on public.projects
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operator_read_active_projects_for_presence" on public.projects
for select to authenticated
using (public.is_operator() and active = true);

create policy "admin_manage_employees" on public.employees
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operator_read_active_employees_for_presence" on public.employees
for select to authenticated
using (public.is_operator() and active = true);

create policy "admin_manage_project_employees" on public.project_employees
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operator_read_project_employees_for_presence" on public.project_employees
for select to authenticated
using (public.is_operator() and active = true);

create policy "admin_manage_presence_photos" on public.presence_photos
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operator_insert_presence_photos" on public.presence_photos
for insert to authenticated
with check (public.is_operator() and captured_by = auth.uid());

create policy "operator_read_own_presence_photos_metadata" on public.presence_photos
for select to authenticated
using (public.is_operator() and captured_by = auth.uid());

create policy "admin_manage_presence" on public.presence
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "operator_insert_presence" on public.presence
for insert to authenticated
with check (public.is_operator() and registered_by = auth.uid());

create policy "operator_read_own_presence" on public.presence
for select to authenticated
using (public.is_operator() and registered_by = auth.uid());

create policy "admin_read_audit_logs" on public.audit_logs
for select to authenticated
using (public.is_admin());

-- Storage bucket foundation. Supabase Storage keeps objects in storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'presence-photos',
  'presence-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admin_storage_presence_photos_all" on storage.objects
for all to authenticated
using (bucket_id = 'presence-photos' and public.is_admin())
with check (bucket_id = 'presence-photos' and public.is_admin());

create policy "operator_storage_presence_photos_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'presence-photos' and public.is_operator());

create policy "operator_storage_presence_photos_read_own_metadata" on storage.objects
for select to authenticated
using (
  bucket_id = 'presence-photos'
  and public.is_operator()
  and exists (
    select 1
    from public.presence_photos pp
    where pp.storage_path = storage.objects.name
      and pp.captured_by = auth.uid()
      and pp.active = true
  )
);
