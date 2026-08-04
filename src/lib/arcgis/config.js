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
