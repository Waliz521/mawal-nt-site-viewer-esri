# Mawal NT Site Viewer (ArcGIS edition)

ArcGIS Maps SDK rebuild of the NT community power-station site viewer. Shares the **same Supabase database** as the production Leaflet app [`mawal-nt-site-viewer`](https://github.com/Waliz521/mawal-nt-site-viewer).

See **[PLAN.md](./PLAN.md)** for architecture, phases, and drone/editing roadmap.

## Quick start

```powershell
npm install
copy .env.example .env   # paste VITE_SUPABASE_* from mawal-nt-site-viewer/.env
npm run dev              # http://localhost:5174
```

## Data ingest

Run from the sibling repo (unchanged):

```powershell
cd ..\site-viewer
npm run ingest:greenfield
```

## Deploy (Vercel)

1. Create GitHub repo **`mawal-nt-site-viewer-esri`** and push this folder as the repo root.
2. Vercel → **Add New Project** → import the repo.
3. Framework preset: **Vite** (or use defaults — `vercel.json` sets build/output).
4. Environment variables (Production + Preview):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Same as Leaflet app |
   | `VITE_SUPABASE_ANON_KEY` | Same as Leaflet app |

5. Deploy. No redeploy needed when new sites are ingested — the app reads Supabase at runtime.

Suggested Vercel project name: `mawal-nt-site-viewer-esri-web` (to mirror `mawal-nt-site-viewer-web`).

## Stack

- React 19 + Vite 6 + React Router 7
- `@arcgis/core` 4.x
- Supabase (read-only anon)
