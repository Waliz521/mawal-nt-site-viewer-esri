# Mawal NT Site Viewer (ArcGIS edition)

ArcGIS Maps SDK rebuild of the NT community power-station site viewer. Shares the **same Supabase database** as the production Leaflet app in `../site-viewer/`.

See **[PLAN.md](./PLAN.md)** for architecture, phases, and drone/editing roadmap.

## Quick start

```powershell
cd site-viewer-esri-sdk
npm install
copy .env.example .env   # paste VITE_SUPABASE_* from site-viewer/.env
npm run dev              # http://localhost:5174
```

## Data ingest

Run from the sibling folder (unchanged):

```powershell
cd ..\site-viewer
npm run ingest:greenfield
```

## Stack

- React 19 + Vite 6 + React Router 7
- `@arcgis/core` 4.x
- Supabase (read-only anon)
