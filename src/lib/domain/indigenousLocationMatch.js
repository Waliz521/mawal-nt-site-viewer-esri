import {
  boundsFromFeature,
  buildSiteSpatialFootprint,
  siteFootprintIntersectsFeature,
} from './geojson';

/** Normalize community / ILOC names for comparison (ILO_NAME21 only — not IRE region). */
export function normalizeLocationName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[()]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when a Mawal site name corresponds to an ABS ILOC name. */
export function siteNameMatchesIloc(siteName, ilocName) {
  const siteNorm = normalizeLocationName(siteName);
  const ilocNorm = normalizeLocationName(ilocName);
  if (!siteNorm || !ilocNorm) return false;
  if (siteNorm === ilocNorm) return true;

  const primary = String(siteName).split(/\s[-–—]\s/)[0]?.trim();
  if (primary && normalizeLocationName(primary) === ilocNorm) return true;

  return false;
}

function addSiteToLocation(index, code, siteId) {
  const existing = index.get(code);
  if (existing) {
    if (!existing.includes(siteId)) existing.push(siteId);
  } else {
    index.set(code, [siteId]);
  }
}

/**
 * Site → ILOC assignment: spatial footprint inside polygon, union name match on ILO_NAME21.
 * A site may appear under multiple ILOCs (e.g. Areyonga by name and Tjuwanpa by geometry).
 */
export function buildSiteIdsByLocation(sites, layers, locations) {
  const index = new Map();
  if (sites.length === 0 || locations.length === 0) return index;

  const layersBySite = new Map();
  for (const layer of layers) {
    const list = layersBySite.get(layer.site_id) ?? [];
    list.push(layer);
    layersBySite.set(layer.site_id, list);
  }

  const footprints = sites.map((site) => ({
    id: site.id,
    ...buildSiteSpatialFootprint(site, layersBySite.get(site.id) ?? []),
  }));

  const locationEntries = locations.map((location) => ({
    code: location.code,
    name: location.name,
    feature: location.feature,
    bounds: boundsFromFeature(location.feature),
  }));

  for (const location of locationEntries) {
    if (!location.bounds) continue;

    for (const footprint of footprints) {
      if (!footprint.bounds) continue;
      if (siteFootprintIntersectsFeature(footprint, location.feature, location.bounds)) {
        addSiteToLocation(index, location.code, footprint.id);
      }
    }
  }

  for (const site of sites) {
    for (const location of locationEntries) {
      if (siteNameMatchesIloc(site.name, location.name)) {
        addSiteToLocation(index, location.code, site.id);
      }
    }
  }

  return index;
}
