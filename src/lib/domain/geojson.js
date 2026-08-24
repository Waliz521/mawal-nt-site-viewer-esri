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

/**
 * Map extent for a community: union of KML layer bounds and the site's listed
 * coordinates. Extra-area / shortfall polygons can sit far from the power
 * station — zooming to layers alone leaves the community off-screen (Minyerri).
 */
export function boundsForSiteView(site, siteLayers = []) {
  const layerBounds = boundsFromLayers(siteLayers);
  const lat = site?.lat != null ? Number(site.lat) : null;
  const lng = site?.lng != null ? Number(site.lng) : null;

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    if (!layerBounds) {
      return { minLat: lat, maxLat: lat, minLng: lng, maxLng: lng };
    }
    return {
      minLat: Math.min(layerBounds.minLat, lat),
      maxLat: Math.max(layerBounds.maxLat, lat),
      minLng: Math.min(layerBounds.minLng, lng),
      maxLng: Math.max(layerBounds.maxLng, lng),
    };
  }

  return layerBounds;
}

/** Fast reject before point-in-polygon tests. */
export function boundsIntersect(a, b) {
  if (!a || !b) return false;
  return (
    a.minLng <= b.maxLng &&
    a.maxLng >= b.minLng &&
    a.minLat <= b.maxLat &&
    a.maxLat >= b.minLat
  );
}

function forEachExteriorRing(geometry, visitRing) {
  if (!geometry) return;
  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates ?? [];
  for (const rings of polygons) {
    if (rings?.[0]) visitRing(rings[0]);
  }
}

/** Exterior ring vertices from a GeoJSON geometry or layer row. */
export function collectGeometryTestPoints(geometryOrLayer) {
  const geometry = getFeatureGeometry(geometryOrLayer);
  const points = [];
  forEachExteriorRing(geometry, (ring) => {
    for (const [lng, lat] of ring) {
      points.push([lng, lat]);
    }
  });
  return points;
}

/**
 * Spatial footprint for indigenous-location matching: bbox plus representative
 * points (site coords, layer vertices, layer/site bbox centers).
 */
export function buildSiteSpatialFootprint(site, siteLayers = []) {
  const testPoints = [];

  if (site?.lat != null && site?.lng != null) {
    testPoints.push([Number(site.lng), Number(site.lat)]);
  }

  for (const layer of siteLayers) {
    const geometry = getFeatureGeometry(layer.geometry_geojson);
    testPoints.push(...collectGeometryTestPoints(geometry));

    const layerBounds = boundsFromFeature(geometry);
    if (layerBounds) {
      testPoints.push([
        (layerBounds.minLng + layerBounds.maxLng) / 2,
        (layerBounds.minLat + layerBounds.maxLat) / 2,
      ]);
    }
  }

  const bounds = boundsFromLayers(siteLayers);
  if (bounds) {
    testPoints.push([
      (bounds.minLng + bounds.maxLng) / 2,
      (bounds.minLat + bounds.maxLat) / 2,
    ]);
  }

  return { bounds, testPoints };
}

/** True when any footprint point falls inside the location feature. */
export function siteFootprintIntersectsFeature(footprint, locationFeature, locationBounds = null) {
  if (!footprint?.bounds || footprint.testPoints.length === 0) return false;

  const featureBounds = locationBounds ?? boundsFromFeature(locationFeature);
  if (!featureBounds || !boundsIntersect(footprint.bounds, featureBounds)) return false;

  return footprint.testPoints.some((point) => pointInFeature(point, locationFeature));
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
