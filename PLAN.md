# Mawal NT Site Viewer — ArcGIS Maps SDK Edition

> **Project folder:** `site-viewer-esri-sdk/`  
> **Sibling app (Leaflet, production):** `site-viewer/` → [mawal-nt-site-viewer-web.vercel.app](https://mawal-nt-site-viewer-web.vercel.app)  
> **Backend:** Same Supabase project as `site-viewer` (shared `sites`, `site_layers`, `site_kml_files`)

This document is the master plan for rebuilding the NT Site Viewer with the **ArcGIS Maps SDK for JavaScript** while preserving Mawal branding, routes, data model, and UX. The Leaflet app remains unchanged; all new work lives in this folder.

---

## 1. Goals

| Goal | Rationale |
|------|-----------|
| **Visual parity** | Same header, batch toggle, site cards, traffic-light styling, map layout |
| **Same Supabase data** | No duplicate ingest pipeline; reuse `site-viewer/scripts/` |
| **ArcGIS-native maps** | Better editing UX (Sketch/Editor), measurement widgets, layer management |
| **Future drone ortho** | Per-site custom imagery basemap aligned to KML digitisation |
| **Separate deploy** | Independent Vercel project; zero risk to production Leaflet app |

### Non-goals (for now)

- Replacing Google Earth Pro as the authoritative KML editor
- Achieving pixel-perfect alignment between web basemaps and Google Earth imagery
- Migrating ingest scripts into this repo (they stay in `site-viewer/`)

---

## 2. Architecture

```
site-viewer-esri-sdk/
├── PLAN.md                 ← this file
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── public/
│   ├── brand/              ← Mawal logo (copied from site-viewer)
│   └── boundaries/         ← NT + indigenous location GeoJSON
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/
│   │   └── app.css         ← ported from site-viewer (Mawal look)
│   ├── components/
│   │   ├── layout/         ← AppLayout, BatchToggle, MapHeaderFilters
│   │   ├── map/            ← ArcGIS wrappers, measure, boundaries
│   │   ├── sites/          ← SiteCard, metadata panels
│   │   └── ui/             ← TrafficLightBadge, SetupRequired, SearchableSelect
│   ├── contexts/           ← SiteBatchContext, MapFiltersContext
│   ├── features/
│   │   ├── home/           ← site list
│   │   ├── overview-map/   ← NT overview (/map)
│   │   └── site-detail/    ← per-site map + tables (/sites/:slug)
│   ├── hooks/              ← useArcGISMap, useSites
│   └── lib/
│       ├── api/            ← Supabase client + queries
│       ├── arcgis/         ← basemaps, symbols, GeoJSON helpers
│       └── domain/         ← layer types, batches, traffic light, format
└── supabase/
    └── migrations/         ← future schema (drone imagery, edit history)
```

### Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + Vite 6 + React Router 7 |
| Maps | `@arcgis/core` 4.x (Maps SDK for JavaScript) |
| Data | `@supabase/supabase-js` (anon key, read-only viewer) |
| Basemap (overview + site) | Esri World Imagery + reference labels (no Mapbox token required) |
| Hosting | Vercel (static SPA) |

### Routes (unchanged from Leaflet app)

| Route | Page |
|-------|------|
| `/` | Site list with search + traffic-light filters |
| `/map` | Northern Territory overview map |
| `/sites/:slug` | Site detail — map, layer toggles, area table |

---

## 3. Supabase (shared backend)

### Existing tables (read-only in this app)

- **`sites`** — site metadata, `site_batch` (`existing` \| `greenfield`), traffic light, lat/lng centroid
- **`site_layers`** — GeoJSON geometry, layer type, color, area m²
- **`site_kml_files`** — raw KML references (ingest metadata)

### Environment variables

Copy from `site-viewer/.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional (Phase 2+):

```env
VITE_ARCGIS_API_KEY=          # only if using premium Esri services or geocoding
```

**Ingest / admin** (not used by the web app — run from sibling folder):

```powershell
cd ..\site-viewer
npm run ingest:greenfield      # or existing ingest scripts
```

Service role key stays in `site-viewer/.env` only.

---

## 4. Implementation phases

### Phase 0 — Foundation ✅ (this scaffold)

- [x] Vite + React project structure
- [x] Mawal branding, CSS, routes, Supabase queries
- [x] Home page: site list, batch toggle, search, traffic-light filters
- [x] ArcGIS `MapView` shell on `/map` and site detail
- [x] Esri World Imagery basemap
- [x] `PLAN.md` + README

### Phase 1 — Map parity (viewer)

- [ ] Overview map: all batch layers as GeoJSON, site status markers
- [ ] NT boundary + indigenous location overlays
- [ ] Map header filters (community, location, layer types) — port from Leaflet app
- [ ] Site detail map: layer toggles, fit-to-site, popups/tooltips
- [ ] ArcGIS **Measurement** widget (line + area) with teal styling
- [ ] Status legend + layer toggle panels

### Phase 2 — Drone imagery basemap

- [ ] Supabase table `site_imagery` (see migration stub)
- [ ] Upload pipeline: orthophoto → Cloud storage (Supabase Storage or S3) → tile URL or ImageServer
- [ ] Per-site basemap switch: Esri global imagery ↔ site drone ortho
- [ ] Document expected CRS (WGS84 / EPSG:4326) and ground control

**Proposed schema** (`supabase/migrations/001_site_imagery_stub.sql`):

```sql
-- site_imagery: one active ortho per site (future)
create table if not exists public.site_imagery (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  label text not null default 'Drone ortho',
  tile_url_template text,        -- e.g. XYZ or ArcGIS tile service URL
  bounds jsonb,                  -- [west, south, east, north]
  capture_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### Phase 3 — Spatial editing

- [ ] Enable **Sketch** / **Editor** on site detail map when drone basemap is active
- [ ] Edit fence, solar, BESS polygons; validate layer type + topology
- [ ] Save workflow: geometry → Supabase (`site_layers.geometry_geojson`) + audit log
- [ ] Optional: export updated KML for Google Earth round-trip
- [ ] Role-gated writes (authenticated users / service role via Edge Function)

### Phase 4 — Production cutover (optional)

- [ ] Separate GitHub repo + Vercel project
- [ ] Client UAT against Leaflet app
- [ ] Redirect or link strategy between apps until feature-complete

---

## 5. ArcGIS design notes

### Basemaps

| Context | Basemap |
|---------|---------|
| Overview `/map` | Esri World Imagery + World Boundaries and Places |
| Site detail (default) | Same as overview |
| Site detail (with drone) | Custom `WebTileLayer` or `ImageryTileLayer` from `site_imagery` |

The Leaflet app uses **Mapbox** on overview and **Esri** on site maps. This Esri edition uses Esri everywhere — simpler licensing and consistent behaviour.

### Layer rendering

- Merge visible layers into a `FeatureCollection` (same approach as `site-viewer/web/src/lib/mapStyles.js`)
- Render via `GeoJSONLayer` with unique-value renderer on `_layerType` or per-feature `color_hex`
- Z-order: fence → cyan → purple → solar → BESS → generators → storage → TBC

### Layer type colours (from ingest)

| Type | Typical colour |
|------|----------------|
| fence | red |
| existing_solar | yellow |
| proposed_solar | green |
| bess | orange |
| generators / storage / tbc | per KML |
| purple | practical buildable |
| cyan | outside fence |

### Measurement

Use `@arcgis/core/widgets/Measurement` with activeTool toggling `distance` / `area`. Style widget chrome to match app teal (`#0d9488`) for satellite contrast.

### Known limitation

KML digitised in Google Earth Pro may not align perfectly with Esri/Mapbox web tiles. **Editing on site-specific drone ortho** (Phase 2–3) is the intended fix — not switching basemap providers alone.

---

## 6. UI parity checklist

| Element | Leaflet app | Esri app status |
|---------|-------------|-----------------|
| Dark header + Mawal logo | ✅ | ✅ Phase 0 |
| Batch toggle (Existing / Greenfield) | ✅ | ✅ Phase 0 |
| Site cards + traffic lights | ✅ | ✅ Phase 0 |
| Search + GREEN/AMBER/RED filters | ✅ | ✅ Phase 0 |
| Overview map full viewport | ✅ | 🔲 Phase 1 |
| Map header filters | ✅ | 🔲 Phase 1 |
| Site markers on overview | ✅ | 🔲 Phase 1 |
| Measure tool | ✅ Leaflet-measure | 🔲 Phase 1 ArcGIS Measurement |
| Site detail layer panel | ✅ | 🔲 Phase 1 |
| Area table | ✅ | 🔲 Phase 1 |
| Disclaimer banner | ✅ | ✅ Phase 0 |

---

## 7. Development commands

```powershell
cd site-viewer-esri-sdk
npm install
cp .env.example .env   # fill Supabase vars from site-viewer/.env
npm run dev            # http://localhost:5174
npm run build
```

Port **5174** avoids clash with Leaflet app on 5173.

---

## 8. Deployment (future)

1. Create GitHub repo `mawal-nt-site-viewer-esri` (or monorepo subfolder deploy)
2. Vercel: root = `site-viewer-esri-sdk`, build = `npm run build`, output = `dist`
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Custom domain optional: `nt-sites-esri.mawal.com.au` or similar

---

## 9. Data workflow (unchanged)

```
Google Earth Pro (KML)
        ↓
site-viewer/scripts/ingest-*.mjs  (service role)
        ↓
Supabase: sites, site_layers, site_kml_files
        ↓
site-viewer-esri-sdk (anon read) ← this app
```

Re-ingest after KML changes — same as production app.

---

## 10. Open questions for client (Brad)

1. **Drone ortho format** — GeoTIFF source, desired max zoom, tiling approach?
2. **Who can edit** — internal Mawal only, or client login?
3. **Cutover** — replace Leaflet app or run both indefinitely?
4. **ArcGIS API key** — needed only for premium services; free Esri tile URLs may suffice for viewer

---

*Last updated: foundation scaffold — Phase 0 complete.*
