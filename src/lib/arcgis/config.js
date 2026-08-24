/** Northern Territory, Australia — map defaults (WGS84). */

export const NT_EXTENT = {
  xmin: 129.0,
  ymin: -26.0,
  xmax: 138.2,
  ymax: -10.5,
  spatialReference: { wkid: 4326 },
};

export const NT_CENTER = [133.8, -19.2];
export const NT_ZOOM = 6;

export const ESRI_IMAGERY_TILE =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

export const ESRI_REFERENCE_TILE =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer';

/**
 * NT Visualiser aerial photography mosaic (WMS 1.1.1).
 * Direct service: https://land.visualiser.nt.gov.au/wms/wms
 * Layer: NTLISGoogleEarth (NTLIS Google Earth mosaic)
 * Licence: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/legalcode
 * Required attribution (when basemap visible): NTG_ATTRIBUTION in config.js
 * Metadata: https://www.ntlis.nt.gov.au/metadata/export_data?metadata_id=2DBCB771210A06B6E040CD9B0F274EFE&type=html
 *
 * NR Maps WMS (nrmaps.nt.gov.au/wms) does not publish aerial imagery — use Visualiser only.
 * The upstream service does not send CORS headers; the app loads tiles via /api/wms-proxy.
 */
export const NTG_WMS_ORIGIN = 'https://land.visualiser.nt.gov.au/wms/wms';
export const NTG_WMS_LAYER = 'NTLISGoogleEarth';
export const NTG_WMS_VERSION = '1.1.1';
export const NTG_WMS_SRS = 'EPSG:4283';
export const NTG_WMS_IMAGE_FORMAT = 'image/jpeg';
export const NTG_WMS_EXTENT = {
  xmin: 110,
  ymin: -50,
  xmax: 160,
  ymax: -5,
  spatialReference: { wkid: 4283 },
};
export const NTG_WMS_PROXY_PATH = '/api/wms-proxy';

/** CC BY 4.0 — required when NTG aerial basemap is visible (NT Department terms). */
export const NTG_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/legalcode';

/** Exact NTG attribution statement + licence link (CC BY 4.0 § 3(a)). */
export const NTG_ATTRIBUTION =
  'Supplied by the Department of Lands, Planning and Environment © Northern Territory Government (CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/legalcode)';

/** Shown when Esri tile basemaps are active (World Imagery, Streets, etc.). */
export const ESRI_BASEMAP_ATTRIBUTION =
  'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

/** Browser-facing WMS URL (same-origin proxy). */
export function getNtgWmsServiceUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${NTG_WMS_PROXY_PATH}`;
  }
  return NTG_WMS_PROXY_PATH;
}
