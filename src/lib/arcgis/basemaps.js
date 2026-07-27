import Basemap from '@arcgis/core/Basemap';
import TileLayer from '@arcgis/core/layers/TileLayer';
import { ESRI_IMAGERY_TILE, ESRI_REFERENCE_TILE } from './config';

export const ESRI_TILE_SERVICES = {
  imagery: ESRI_IMAGERY_TILE,
  reference: ESRI_REFERENCE_TILE,
  streets: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
  topo: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
  terrain: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer',
  terrainReference:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer',
  darkGray: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer',
  darkGrayReference:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer',
  lightGray: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer',
  lightGrayReference:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer',
  natGeo: 'https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer',
  oceans: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer',
  oceansReference:
    'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer',
};

function tileBasemap(id, title, baseUrl, referenceUrl = null) {
  const baseLayers = [new TileLayer({ url: baseUrl, title })];
  const referenceLayers = referenceUrl
    ? [new TileLayer({ url: referenceUrl, listMode: 'hide' })]
    : [];

  return new Basemap({
    id,
    title,
    baseLayers,
    referenceLayers,
  });
}

/** Free Esri tile basemaps — no portal / API key required. */
export function createEsriImageryBasemap() {
  return tileBasemap('world-imagery', 'Imagery', ESRI_TILE_SERVICES.imagery, ESRI_TILE_SERVICES.reference);
}

export function createEsriImageryOnlyBasemap() {
  return tileBasemap('world-imagery-plain', 'Imagery (no labels)', ESRI_TILE_SERVICES.imagery);
}

export function createEsriStreetsBasemap() {
  return tileBasemap('world-streets', 'Streets', ESRI_TILE_SERVICES.streets);
}

export function createEsriTopoBasemap() {
  return tileBasemap('world-topo', 'Topographic', ESRI_TILE_SERVICES.topo);
}

export function createEsriTerrainBasemap() {
  return tileBasemap(
    'world-terrain',
    'Terrain',
    ESRI_TILE_SERVICES.terrain,
    ESRI_TILE_SERVICES.terrainReference,
  );
}

export function createEsriDarkGrayBasemap() {
  return tileBasemap(
    'world-dark-gray',
    'Dark gray canvas',
    ESRI_TILE_SERVICES.darkGray,
    ESRI_TILE_SERVICES.darkGrayReference,
  );
}

export function createEsriLightGrayBasemap() {
  return tileBasemap(
    'world-light-gray',
    'Light gray canvas',
    ESRI_TILE_SERVICES.lightGray,
    ESRI_TILE_SERVICES.lightGrayReference,
  );
}

export function createEsriNatGeoBasemap() {
  return tileBasemap('world-natgeo', 'NatGeo', ESRI_TILE_SERVICES.natGeo);
}

export function createEsriOceansBasemap() {
  return tileBasemap(
    'world-oceans',
    'Oceans',
    ESRI_TILE_SERVICES.oceans,
    ESRI_TILE_SERVICES.oceansReference,
  );
}

/** Factories only — never reuse Basemap instances across Map lifecycles. */
export const BASEMAP_OPTIONS = [
  { id: 'world-imagery', title: 'Imagery', create: createEsriImageryBasemap },
  { id: 'world-imagery-plain', title: 'Imagery (no labels)', create: createEsriImageryOnlyBasemap },
  { id: 'world-streets', title: 'Streets', create: createEsriStreetsBasemap },
  { id: 'world-topo', title: 'Topographic', create: createEsriTopoBasemap },
  { id: 'world-terrain', title: 'Terrain', create: createEsriTerrainBasemap },
  { id: 'world-natgeo', title: 'NatGeo', create: createEsriNatGeoBasemap },
  { id: 'world-light-gray', title: 'Light gray', create: createEsriLightGrayBasemap },
  { id: 'world-dark-gray', title: 'Dark gray', create: createEsriDarkGrayBasemap },
  { id: 'world-oceans', title: 'Oceans', create: createEsriOceansBasemap },
];

/** @deprecated Use createEsriImageryBasemap() so each map gets a fresh instance. */
export function createDefaultBasemap() {
  return createEsriImageryBasemap();
}

/** Fresh basemap instances for a gallery / picker (safe for one Map lifetime). */
export function createBasemapGalleryBasemaps() {
  return BASEMAP_OPTIONS.map((option) => option.create());
}
