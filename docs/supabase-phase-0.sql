-- Phase 0: engine-aware works and thumbnails.
-- Run this in Supabase SQL editor, then create the storage bucket below.

alter table public.works
  add column if not exists engine text default 'p5-sketch',
  add column if not exists document_version integer default 1,
  add column if not exists document jsonb,
  add column if not exists thumbnail_url text;

update public.works
set
  engine = coalesce(engine, case when template_id = 'texture-patch' then 'texture-patch' else 'p5-sketch' end),
  document_version = coalesce(document_version, 1)
where engine is null or document_version is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'works_engine_check'
  ) then
    alter table public.works
      add constraint works_engine_check
      check (engine in ('texture-patch', 'p5-sketch'));
  end if;
end $$;

create index if not exists works_engine_idx on public.works(engine);

-- Storage:
-- 1. Create a bucket named: work-thumbnails
-- 2. Make it public, or add equivalent read policies for published thumbnails.
-- 3. Allow authenticated users to upload/update paths under their own user id.
