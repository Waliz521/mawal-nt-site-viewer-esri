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

## NTG Aerial Photography basemap

The overview and site-detail maps include **NTG Aerial Photography** as an optional basemap (alongside Esri World Imagery and other Esri tiles).

| Item | Value |
|------|--------|
| Service | [NT Visualiser WMS](https://land.visualiser.nt.gov.au/wms/wms) |
| WMS version | 1.1.1 |
| Layer | `NTLISGoogleEarth` (NT aerial mosaic) |
| Licence | [CC BY 4.0 Legal Code](https://creativecommons.org/licenses/by/4.0/legalcode) |
| Attribution (when NTG basemap active) | Supplied by the Department of Lands, Planning and Environment © Northern Territory Government |

NT Department geospatial products are used under CC BY 4.0. The required attribution appears in the map attribution bar when **NTG Aerial Photography** is selected.

NR Maps WMS (`nrmaps.nt.gov.au/wms`) does **not** publish aerial imagery — only the Visualiser mosaic is used.

The upstream WMS does not send CORS headers, so the app loads tiles through a same-origin proxy:

- **Production / Preview:** Vercel serverless function at `/api/wms-proxy` (`api/wms-proxy.js`)
- **Local dev:** Vite dev-server proxy (see `vite.config.js`) — no extra env vars required

Esri World Imagery remains the default basemap. NTG tiles use explicit WMS `GetMap` requests (not ArcGIS `WMSLayer`, which did not tile reliably against this service).

## Stack

- React 19 + Vite 6 + React Router 7
- `@arcgis/core` 4.x
- Supabase (read-only anon)
