/** GeoJSON geometry helpers (shared with Leaflet app). */
export function getFeatureGeometry(featureOrGeometry) {
  if (!featureOrGeometry) return null;
  if (featureOrGeometry.type === 'Feature') {
    return featureOrGeometry.geometry ?? null;
  }
  if (featureOrGeometry.type === 'Polygon' || featureOrGeometry.type === 'MultiPolygon') {
    return featureOrGeometry;
  }
  return null;
}

export function boundsFromFeature(feature) {
  const geometry = getFeatureGeometry(feature);
  if (!geometry) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const rings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((p) => p[0]);

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }

  if (!Number.isFinite(minLat)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

export function boundsFromLayers(layers) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const layer of layers) {
    const geometry = getFeatureGeometry(layer.geometry_geojson);
    if (!geometry) continue;

    const rings =
      geometry.type === 'Polygon'
        ? [geometry.coordinates[0]]
        : geometry.coordinates.map((p) => p[0]);

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    }
  }

  if (!Number.isFinite(minLat)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

/** Centroid used to place a site on the map: explicit coords, else layer bounds. */
export function siteCentroid(site, siteLayers = []) {
  if (site?.lat != null && site?.lng != null) {
    return [Number(site.lng), Number(site.lat)];
  }

  const bounds = boundsFromLayers(siteLayers);
  if (!bounds) return null;

  return [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2];
}

function pointInRing(lng, lat, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

/** Ray-casting hit test; polygon holes (rings after the first) are excluded. */
export function pointInFeature([lng, lat], featureOrGeometry) {
  const geometry = getFeatureGeometry(featureOrGeometry);
  if (!geometry) return false;

  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

  for (const rings of polygons) {
    if (!rings?.length || !pointInRing(lng, lat, rings[0])) continue;
    const inHole = rings.slice(1).some((hole) => pointInRing(lng, lat, hole));
    if (!inHole) return true;
  }

  return false;
}

export function extentFromBounds(bounds, spatialReference = { wkid: 4326 }) {
  if (!bounds) return null;
  return {
    xmin: bounds.minLng,
    ymin: bounds.minLat,
    xmax: bounds.maxLng,
    ymax: bounds.maxLat,
    spatialReference,
  };
}
