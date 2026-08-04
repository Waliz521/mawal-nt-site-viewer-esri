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

## Deploy (Vercel)

1. Import repo **`mawal-nt-site-viewer-esri`** in Vercel (Framework: **Vite**).
2. **Required** environment variables (Production + Preview):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | Same as Leaflet app |
   | `VITE_SUPABASE_ANON_KEY` | Same as Leaflet app |

3. Deploy. If you add variables after the first deploy, **redeploy** so Vite bakes them into the bundle.

Live URL: `https://mawal-nt-site-viewer-esri.vercel.app`

## Stack

- React 19 + Vite 6 + React Router 7
- `@arcgis/core` 4.x
- Supabase (read-only anon)
