import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import { symbolForLayerType } from './layerStyles';
import { TRAFFIC_LIGHT_COLORS } from '../domain/trafficLight';
import { siteCentroid } from '../domain/geojson';
import { NT_BOUNDARY_URL } from '../domain/boundaries';

const blobUrlCache = new Map();

const KML_FIELDS = [
  { name: 'layerId', type: 'string' },
  { name: 'layerType', type: 'string' },
  { name: 'layerName', type: 'string' },
  { name: 'siteName', type: 'string' },
  { name: 'siteSlug', type: 'string' },
  { name: 'areaM2', type: 'double' },
];

const SITE_FIELDS = [
  { name: 'siteId', type: 'string' },
  { name: 'name', type: 'string' },
  { name: 'slug', type: 'string' },
  { name: 'trafficLight', type: 'string' },
  { name: 'targetKw', type: 'double' },
];

const MARKER_MIN_SIZE = 9;
const MARKER_MAX_SIZE = 32;
const MARKER_SIZE_STEPS = 4;

/**
 * Symbol area — not diameter — should track the target, otherwise a site twice
 * the size of another looks four times bigger.
 */
function targetKwSizeStops(values) {
  const positive = values.filter((value) => value > 0);
  if (positive.length < 2) return null;

  const min = Math.min(...positive);
  const max = Math.max(...positive);
  if (max === min) return null;

  return Array.from({ length: MARKER_SIZE_STEPS + 1 }, (_, index) => {
    const ratio = index / MARKER_SIZE_STEPS;
    const value = min + (max - min) * ratio;
    return {
      value,
      size: MARKER_MIN_SIZE + (MARKER_MAX_SIZE - MARKER_MIN_SIZE) * Math.sqrt(ratio),
      label: index === 0 || index === MARKER_SIZE_STEPS ? `${Math.round(value)} kWac` : undefined,
    };
  });
}

/**
 * GeoJSONLayer only accepts WGS84 / CRS84. Source files exported from NR Maps
 * carry a named `crs` member (EPSG:7844) that makes the layer fail to load,
 * even though the coordinates are already lon/lat.
 */
function stripUnsupportedCrs(featureCollection) {
  if (!featureCollection || !('crs' in featureCollection)) return featureCollection;
  const { crs, ...rest } = featureCollection;
  return rest;
}

function assignGeoJsonUrl(config, id, geojsonOrUrl) {
  if (typeof geojsonOrUrl === 'string') {
    return { ...config, url: geojsonOrUrl };
  }

  revokeBlobUrl(id);
  const payload = JSON.stringify(stripUnsupportedCrs(geojsonOrUrl));
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(id, url);
  return { ...config, url };
}

export function createGeoJsonLayer(featureCollection, id = 'site-layers', title = 'KML profiles') {
  if (!featureCollection.features.length) return null;

  const uniqueTypes = [
    ...new Set(featureCollection.features.map((f) => f.properties?.layerType ?? 'other')),
  ];

  return new GeoJSONLayer(
    assignGeoJsonUrl(
      {
        id,
        title,
        listMode: 'show',
        legendEnabled: true,
        popupEnabled: true,
        outFields: ['*'],
        fields: KML_FIELDS,
        spatialReference: { wkid: 4326 },
        popupTemplate: {
          title: '{layerName}',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                { fieldName: 'siteName', label: 'Community' },
                {
                  fieldName: 'areaM2',
                  label: 'Area (m²)',
                  format: { digitSeparator: true, places: 1 },
                },
              ],
            },
          ],
        },
        renderer: {
          type: 'unique-value',
          field: 'layerType',
          uniqueValueInfos: uniqueTypes.map((type) => {
            const sample = featureCollection.features.find((f) => f.properties?.layerType === type);
            return {
              value: type,
              symbol: symbolForLayerType(type, sample?.properties?.colorHex),
            };
          }),
          defaultSymbol: symbolForLayerType('other'),
        },
      },
      id,
      featureCollection,
    ),
  );
}

export function createNtBoundaryLayer(style) {
  return new GeoJSONLayer({
    id: 'nt-boundary',
    url: NT_BOUNDARY_URL,
    title: 'Northern Territory',
    listMode: 'show',
    legendEnabled: true,
    popupEnabled: false,
    spatialReference: { wkid: 4326 },
    renderer: buildBoundaryRenderer(style),
  });
}

/** Indigenous locations as GeoJSONLayer (GeoJSON ≠ ArcGIS JSON — fromJSON returns null). */
export function createIndigenousGraphicsLayer(
  geojson,
  style,
  { id = 'indigenous-locations', title = 'Indigenous locations', listMode = 'show' } = {},
) {
  if (!geojson?.features?.length) return null;

  return new GeoJSONLayer(
    assignGeoJsonUrl(
      {
        id,
        title,
        listMode,
        legendEnabled: true,
        popupEnabled: true,
        outFields: ['*'],
        // Source CRS is GDA2020 (EPSG:7844); lon/lat values display correctly as WGS84.
        spatialReference: { wkid: 4326 },
        renderer: buildBoundaryRenderer(style),
        popupTemplate: {
          title: '{ILO_NAME21}',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                { fieldName: 'ILO_CODE21', label: 'ILO code' },
                { fieldName: 'IRE_NAME21', label: 'Region' },
                { fieldName: 'AREASQKM21', label: 'Area (km²)', format: { places: 2 } },
              ],
            },
          ],
        },
      },
      id,
      geojson,
    ),
  );
}

function buildBoundaryRenderer(style) {
  return {
    type: 'simple',
    symbol: {
      type: 'simple-fill',
      color: style.fillColor,
      outline: {
        color: style.outlineColor,
        width: style.outlineWidth,
      },
    },
  };
}

export function createSiteMarkersLayer(sites, layers, visibleSiteIds, id = 'site-markers') {
  revokeBlobUrl(id);

  const layersBySite = {};
  for (const layer of layers) {
    if (!layersBySite[layer.site_id]) layersBySite[layer.site_id] = [];
    layersBySite[layer.site_id].push(layer);
  }

  const features = sites
    .filter((site) => visibleSiteIds.has(site.id))
    .map((site) => {
      const coords = siteCentroid(site, layersBySite[site.id] ?? []);
      if (!coords) return null;

      const rating = site.traffic_light ?? 'UNKNOWN';
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
        properties: {
          siteId: site.id,
          name: site.name,
          slug: site.slug,
          trafficLight: rating,
          targetKw: Number(site.target_solar_kwac) || 0,
        },
      };
    })
    .filter(Boolean);

  if (!features.length) return null;

  const featureCollection = { type: 'FeatureCollection', features };
  const ratings = [...new Set(features.map((f) => f.properties.trafficLight))];
  const sizeStops = targetKwSizeStops(features.map((f) => f.properties.targetKw));

  return new GeoJSONLayer(
    assignGeoJsonUrl(
      {
        id,
        title: 'Power-station sites',
        listMode: 'show',
        legendEnabled: true,
        popupEnabled: true,
        outFields: ['*'],
        fields: SITE_FIELDS,
        spatialReference: { wkid: 4326 },
        popupTemplate: {
          title: '{name}',
          content: [
            {
              type: 'fields',
              fieldInfos: [
                { fieldName: 'trafficLight', label: 'Rating' },
                {
                  fieldName: 'targetKw',
                  label: 'Target solar (kWac)',
                  format: { digitSeparator: true, places: 0 },
                },
              ],
            },
            { type: 'text', text: '<a href="/sites/{slug}">Open site profile</a>' },
          ],
        },
        renderer: {
          type: 'unique-value',
          field: 'trafficLight',
          uniqueValueInfos: ratings.map((rating) => {
            const colors = TRAFFIC_LIGHT_COLORS[rating] ?? { fill: '#64748b', stroke: '#334155' };
            return {
              value: rating,
              label: colors.label ?? rating,
              symbol: {
                type: 'simple-marker',
                color: hexToRgba(colors.fill, 0.92),
                size: MARKER_MIN_SIZE,
                outline: { color: hexToRgb(colors.stroke), width: 1.5 },
              },
            };
          }),
          defaultSymbol: {
            type: 'simple-marker',
            color: [100, 116, 139, 0.92],
            size: MARKER_MIN_SIZE,
            outline: { color: [51, 65, 85], width: 1.5 },
          },
          visualVariables: sizeStops
            ? [
                {
                  type: 'size',
                  field: 'targetKw',
                  legendOptions: { title: 'Target solar (kWac)' },
                  stops: sizeStops,
                },
              ]
            : [],
        },
        featureReduction: {
          type: 'cluster',
          clusterRadius: '70px',
          // A dedicated cluster symbol; `renderer` here would also override the
          // proportional symbols of individual sites.
          symbol: {
            type: 'simple-marker',
            color: [15, 118, 110, 0.92],
            size: 26,
            outline: { color: [255, 255, 255, 0.9], width: 1.5 },
          },
          fields: [
            { name: 'clusterTargetKw', onStatisticField: 'targetKw', statisticType: 'sum' },
          ],
          labelingInfo: [
            {
              deconflictionStrategy: 'none',
              labelPlacement: 'center-center',
              labelExpressionInfo: { expression: '$feature.cluster_count' },
              symbol: {
                type: 'text',
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                haloColor: '#0f172a',
                haloSize: 0.8,
              },
            },
          ],
          popupTemplate: {
            title: 'Site cluster',
            content: [
              {
                type: 'text',
                text: '<b>{cluster_count}</b> sites — zoom in to separate them.',
              },
              {
                type: 'fields',
                fieldInfos: [
                  {
                    fieldName: 'clusterTargetKw',
                    label: 'Combined target solar (kWac)',
                    format: { digitSeparator: true, places: 0 },
                  },
                ],
              },
            ],
          },
        },
      },
      id,
      featureCollection,
    ),
  );
}

export function revokeBlobUrl(id) {
  const existing = blobUrlCache.get(id);
  if (existing) {
    URL.revokeObjectURL(existing);
    blobUrlCache.delete(id);
  }
}

export function revokeAllBlobUrls() {
  for (const id of [...blobUrlCache.keys()]) {
    revokeBlobUrl(id);
  }
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
