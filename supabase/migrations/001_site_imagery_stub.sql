-- Future: per-site drone orthophoto basemaps (Phase 2)
-- Run manually in Supabase SQL Editor when ready — NOT applied automatically.

create table if not exists public.site_imagery (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  label text not null default 'Drone ortho',
  tile_url_template text,
  bounds jsonb,
  capture_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists site_imagery_site_id_idx on public.site_imagery(site_id);

comment on table public.site_imagery is
  'Optional per-site imagery basemap for aligned editing (site-viewer-esri-sdk Phase 2).';
