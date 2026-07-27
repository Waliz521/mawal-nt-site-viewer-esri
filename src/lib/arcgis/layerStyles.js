export function zIndexForType(type) {
  const order = {
    fence: 1,
    cyan: 2,
    purple: 3,
    existing_solar: 4,
    proposed_solar: 5,
    bess: 6,
    generators: 7,
    storage: 8,
    tbc: 9,
    other: 0,
  };
  return order[type] ?? 0;
}

/** Property names must not start with "_" — ArcGIS GeoJSONLayer drops those fields. */
export function buildFeatureCollection(layers, visibleLayerIds) {
  const features = layers
    .filter((layer) => visibleLayerIds.has(layer.id))
    .sort((a, b) => zIndexForType(a.layer_type) - zIndexForType(b.layer_type))
    .map((layer) => {
      const feature = layer.geometry_geojson;
      return {
        type: 'Feature',
        geometry: feature.geometry ?? feature,
        properties: {
          layerId: layer.id,
          layerType: layer.layer_type,
          layerName: layer.layer_name,
          colorHex: layer.color_hex,
          areaM2: layer.area_m2 ?? null,
          siteName: layer.sites?.name ?? '',
          siteSlug: layer.sites?.slug ?? '',
        },
      };
    });

  return { type: 'FeatureCollection', features };
}

export function symbolForLayerType(layerType, colorHex = '#999999') {
  const isFence = layerType === 'fence';
  const color = colorHex || '#999999';

  return {
    type: 'simple-fill',
    color: isFence ? [0, 0, 0, 0.08] : hexToRgba(color, 0.35),
    outline: {
      color: hexToRgb(color),
      width: isFence ? 2.5 : 2,
    },
  };
}

function hexToRgb(hex) {
  const normalized = String(hex).replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized.padStart(6, '0').slice(0, 6);
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function hexToRgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return [r, g, b, alpha];
}
