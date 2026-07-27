export const INDIGENOUS_LOCATIONS_URL = '/boundaries/nt-indigenous-locations.geojson';
export const NT_BOUNDARY_URL = '/boundaries/nt-boundary.geojson';

export async function fetchNtBoundaryGeoJson() {
  const response = await fetch(NT_BOUNDARY_URL);
  if (!response.ok) {
    throw new Error('Failed to load NT boundary');
  }
  return response.json();
}

export async function fetchIndigenousLocationsGeoJson() {
  const response = await fetch(INDIGENOUS_LOCATIONS_URL);
  if (!response.ok) {
    throw new Error('Failed to load indigenous location boundaries');
  }
  return response.json();
}

export function listIndigenousLocations(geojson) {
  return (geojson?.features ?? [])
    .map((feature) => ({
      code: String(feature.properties?.ILO_CODE21 ?? ''),
      name: String(feature.properties?.ILO_NAME21 ?? 'Unknown'),
      feature,
    }))
    .filter((row) => row.code)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterIndigenousGeoJson(geojson, selectedCode) {
  if (!geojson) return null;
  if (!selectedCode) return geojson;

  return {
    type: 'FeatureCollection',
    features: (geojson.features ?? []).filter(
      (feature) => String(feature.properties?.ILO_CODE21 ?? '') === selectedCode,
    ),
  };
}
