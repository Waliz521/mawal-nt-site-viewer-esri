import { ESRI_BASEMAP_ATTRIBUTION, NTG_ATTRIBUTION } from '../../lib/arcgis/config';

export default function MapAttributionBar({ basemapId = 'world-imagery' }) {
  const isNtg = basemapId === 'ntg-aerial';
  const text = isNtg ? NTG_ATTRIBUTION : ESRI_BASEMAP_ATTRIBUTION;

  return (
    <div className="map-attribution-bar" role="contentinfo" aria-label="Map data attribution">
      <p>{text}</p>
    </div>
  );
}
