-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
-- for a fresh project. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  slides jsonb not null,
  source_doc_url text,
  created_by uuid not null references auth.users(id) on delete set null,
  created_by_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists presentations_created_at_idx
  on public.presentations (created_at desc);

alter table public.presentations enable row level security;

-- Org-wide read: any signed-in user whose email is on the allowed domain
-- can see every presentation (this is a shared org library, not per-user).
drop policy if exists "gwi users can read presentations" on public.presentations;
create policy "gwi users can read presentations"
  on public.presentations for select
  to authenticated
  using (
    (auth.jwt() ->> 'email') like '%@gwi.com'
  );

-- Org-wide write: any signed-in gwi.com user can save a new presentation.
drop policy if exists "gwi users can insert presentations" on public.presentations;
create policy "gwi users can insert presentations"
  on public.presentations for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'email') like '%@gwi.com'
    and created_by = auth.uid()
  );

-- Only the original creator can delete their own generated deck.
drop policy if exists "creators can delete their presentations" on public.presentations;
create policy "creators can delete their presentations"
  on public.presentations for delete
  to authenticated
  using (created_by = auth.uid());

-- Note on the domain check: swap '%@gwi.com' for your own domain if you
-- fork this for another org, and keep it in sync with ALLOWED_EMAIL_DOMAIN
-- in the app's environment variables (used by middleware.ts).
