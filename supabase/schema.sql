-- ============================================================
-- GLITCH Magazine : schéma Supabase
-- À coller UNE FOIS dans Supabase > SQL Editor > New query > Run
-- Avant de lancer : remplace TON-EMAIL@exemple.com (tout en bas) par l'email du compte admin
-- que tu auras créé dans Authentication > Users.
-- ============================================================

-- Admin(s) autorisé(s)
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admins lisent leur ligne" on public.admins;
create policy "admins lisent leur ligne" on public.admins for select to authenticated using (user_id = auth.uid());

-- Volumes
create table if not exists public.volumes (
  slug text primary key,
  number int not null unique check (number between 1 and 999),
  status text not null default 'hidden' check (status in ('hidden','draft','published')),
  release_date date,
  hooks text[] not null default '{}',
  handwritten text,
  editorial text,
  cover text,
  pdf text,
  sections jsonb not null default '[]',
  playlists jsonb not null default '[]',
  moodboards jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
alter table public.volumes enable row level security;
drop policy if exists "volumes visibles" on public.volumes;
create policy "volumes visibles" on public.volumes for select to anon, authenticated using (status <> 'hidden' or public.is_admin());
drop policy if exists "volumes admin" on public.volumes;
create policy "volumes admin" on public.volumes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Réglages (une seule ligne)
create table if not exists public.settings (id int primary key default 1 check (id = 1), data jsonb not null default '{}');
alter table public.settings enable row level security;
drop policy if exists "reglages lisibles" on public.settings;
create policy "reglages lisibles" on public.settings for select to anon, authenticated using (true);
drop policy if exists "reglages admin" on public.settings;
create policy "reglages admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.settings (id, data) values (1, '{}') on conflict do nothing;

-- Notes (ajoutées à la main)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 1500),
  date timestamptz not null default now(),
  url text
);
alter table public.notes enable row level security;
drop policy if exists "notes lisibles" on public.notes;
create policy "notes lisibles" on public.notes for select to anon, authenticated using (true);
drop policy if exists "notes admin" on public.notes;
create policy "notes admin" on public.notes for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Correspondance et commentaires
create table if not exists public.messages (
  id uuid primary key,
  kind text not null check (kind in ('letter','comment')),
  target_type text check (target_type in ('volume','post')),
  target_slug text check (char_length(target_slug) <= 200),
  name text not null check (char_length(name) between 1 and 60),
  subject text check (char_length(subject) <= 120),
  body text not null check (char_length(body) between 5 and 1500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reply text check (char_length(reply) <= 1500),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "messages approuves visibles" on public.messages;
create policy "messages approuves visibles" on public.messages for select to anon, authenticated using (status = 'approved' or public.is_admin());
drop policy if exists "envoi de messages" on public.messages;
create policy "envoi de messages" on public.messages for insert to anon, authenticated with check (status = 'pending' and reply is null and replied_at is null);
drop policy if exists "messages admin modif" on public.messages;
create policy "messages admin modif" on public.messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages admin suppr" on public.messages;
create policy "messages admin suppr" on public.messages for delete to authenticated using (public.is_admin());

-- Emails des lecteurs : privés (jamais lisibles publiquement)
create table if not exists public.message_contacts (
  message_id uuid primary key references public.messages(id) on delete cascade,
  email text not null check (char_length(email) <= 200)
);
alter table public.message_contacts enable row level security;
drop policy if exists "envoi email" on public.message_contacts;
create policy "envoi email" on public.message_contacts for insert to anon, authenticated with check (true);
drop policy if exists "email admin" on public.message_contacts;
create policy "email admin" on public.message_contacts for select to authenticated using (public.is_admin());
drop policy if exists "email admin suppr" on public.message_contacts;
create policy "email admin suppr" on public.message_contacts for delete to authenticated using (public.is_admin());

-- Stockage des couvertures et PDF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg','image/png','image/webp','image/avif','application/pdf'])
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "media lecture" on storage.objects;
create policy "media lecture" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists "media ecriture admin" on storage.objects;
create policy "media ecriture admin" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media maj admin" on storage.objects;
create policy "media maj admin" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media suppr admin" on storage.objects;
create policy "media suppr admin" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- >>> DERNIÈRE ÉTAPE : déclare ton compte comme admin (remplace l'email) <<<
insert into public.admins (user_id)
select id from auth.users where email = 'purplegreen438@gmail.com'
on conflict do nothing;
