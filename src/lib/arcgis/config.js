/** Northern Territory, Australia — map defaults (WGS84). */

export const NT_EXTENT = {
  xmin: 129.0,
  ymin: -26.0,
  xmax: 138.2,
  ymax: -11.8,
  spatialReference: { wkid: 4326 },
};

/** [lng, lat] — overview default at NT_ZOOM (balance north/south at wide zoom). */
export const NT_CENTER = [133.8, -19.0];
export const NT_ZOOM = 6.2;

/** Offsets goTo so the header doesn’t clip Darwin / north NT. */
export const NT_VIEW_PADDING = { top: 72, bottom: 28, left: 24, right: 24 };

export const ESRI_IMAGERY_TILE =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

export const ESRI_REFERENCE_TILE =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer';
