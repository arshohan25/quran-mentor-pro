-- ============ 1. Roles enum + user_roles table ============
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- ============ 2. has_role security definer ============
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ============ 3. RLS for user_roles ============
drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all roles" on public.user_roles;
create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can insert roles" on public.user_roles;
create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Admins can update roles"
on public.user_roles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ============ 4. audit_logs table ============
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Authenticated can insert audit logs" on public.audit_logs;
create policy "Authenticated can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (auth.uid() = actor_id or actor_id is null);

-- ============ 5. Auto-audit role changes ============
create or replace function public.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'role.assigned', 'user', NEW.user_id::text,
      jsonb_build_object('role', NEW.role));
  elsif TG_OP = 'DELETE' then
    insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
    values (auth.uid(), 'role.revoked', 'user', OLD.user_id::text,
      jsonb_build_object('role', OLD.role));
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_audit_role_change on public.user_roles;
create trigger trg_audit_role_change
after insert or delete on public.user_roles
for each row execute function public.audit_role_change();

-- ============ 6. app_settings (singleton) ============
create table if not exists public.app_settings (
  id integer primary key default 1,
  settings jsonb not null default '{
    "announcement": {"enabled": false, "text": "", "level": "info"},
    "features": {
      "ask_ai": true,
      "live_recitation": true,
      "hifz_srs": true,
      "tafsir_compare": true
    },
    "defaults": {
      "daily_minutes_goal": 20
    }
  }'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings"
on public.app_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update app settings" on public.app_settings;
create policy "Admins can update app settings"
on public.app_settings for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- ============ 7. Admin-override policies on existing tables ============

-- profiles
drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- bookmarks_sync
drop policy if exists "Admins can read all bookmarks" on public.bookmarks_sync;
create policy "Admins can read all bookmarks"
on public.bookmarks_sync for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any bookmark" on public.bookmarks_sync;
create policy "Admins can delete any bookmark"
on public.bookmarks_sync for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- hifz_srs
drop policy if exists "Admins can read all hifz" on public.hifz_srs;
create policy "Admins can read all hifz"
on public.hifz_srs for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any hifz" on public.hifz_srs;
create policy "Admins can delete any hifz"
on public.hifz_srs for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- qaza_sync
drop policy if exists "Admins can read all qaza" on public.qaza_sync;
create policy "Admins can read all qaza"
on public.qaza_sync for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any qaza" on public.qaza_sync;
create policy "Admins can delete any qaza"
on public.qaza_sync for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- recitation_sessions
drop policy if exists "Admins can read all recitation sessions" on public.recitation_sessions;
create policy "Admins can read all recitation sessions"
on public.recitation_sessions for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any recitation session" on public.recitation_sessions;
create policy "Admins can delete any recitation session"
on public.recitation_sessions for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- recitation_word_stats
drop policy if exists "Admins can read all word stats" on public.recitation_word_stats;
create policy "Admins can read all word stats"
on public.recitation_word_stats for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any word stats" on public.recitation_word_stats;
create policy "Admins can delete any word stats"
on public.recitation_word_stats for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- user_settings
drop policy if exists "Admins can read all user settings" on public.user_settings;
create policy "Admins can read all user settings"
on public.user_settings for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete any user settings" on public.user_settings;
create policy "Admins can delete any user settings"
on public.user_settings for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- ============ 8. update_updated_at on app_settings ============
drop trigger if exists trg_app_settings_updated on public.app_settings;
create trigger trg_app_settings_updated
before update on public.app_settings
for each row execute function public.update_updated_at_column();
