-- StyleMe web: sessions + private photo bucket. Run in Supabase SQL editor or CLI.

create extension if not exists "pgcrypto";

create table if not exists public.style_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occasion text,
  hair_length_pref text,
  hair_goal text,
  face_shape text,
  prompt text,
  style_pill text,
  ideas jsonb,
  photo_storage_path text,
  created_at timestamptz default now()
);

alter table public.style_sessions enable row level security;

drop policy if exists "style_sessions_own" on public.style_sessions;
create policy "style_sessions_own"
  on public.style_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('styleme-photos', 'styleme-photos', false)
on conflict (id) do nothing;

drop policy if exists "styleme_photos_insert" on storage.objects;
create policy "styleme_photos_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'styleme-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "styleme_photos_select" on storage.objects;
create policy "styleme_photos_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'styleme-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "styleme_photos_update" on storage.objects;
create policy "styleme_photos_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'styleme-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "styleme_photos_delete" on storage.objects;
create policy "styleme_photos_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'styleme-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
