import BaseTileLayer from '@arcgis/core/layers/BaseTileLayer';
import { NTG_WMS_SRS } from './config';

const WEB_MERCATOR_R = 6378137;
const WEB_MERCATOR_HALF = Math.PI * WEB_MERCATOR_R;

/** Convert a Web-Mercator tile bbox to WMS 1.1.1 geographic BBOX (lon/lat). */
function webMercatorBoundsToGeoBbox(bounds) {
  const [xmin, ymin, xmax, ymax] = bounds;
  const toLonLat = (x, y) => {
    const lon = (x / WEB_MERCATOR_HALF) * 180;
    const lat = (Math.atan(Math.exp((y / WEB_MERCATOR_R) * 1)) * 360) / Math.PI - 90;
    return [lon, lat];
  };
  const [lonMin, latMin] = toLonLat(xmin, ymin);
  const [lonMax, latMax] = toLonLat(xmax, ymax);
  return `${lonMin},${latMin},${lonMax},${latMax}`;
}

/**
 * NTG aerial mosaic as Web-Mercator tiles via explicit WMS GetMap URLs.
 * NTG WMS only accepts geographic BBOX (EPSG:4283) — Web-Mercator BBOX returns HTTP 500.
 */
export default class NtgWmsTileLayer extends BaseTileLayer {
  constructor(options = {}) {
    super({
      title: options.title,
      copyright: options.copyright,
    });
    this._wmsUrl = options.wmsUrl;
    this._wmsLayerName = options.wmsLayerName;
    this._wmsVersion = options.wmsVersion;
    this._wmsFormat = options.wmsFormat;
    this._wmsSrs = options.wmsSrs ?? NTG_WMS_SRS;
  }

  getTileUrl(level, row, col) {
    const tileSize = this.tileInfo.size[0];
    const bounds = this.getTileBounds(level, row, col);
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: this._wmsVersion,
      REQUEST: 'GetMap',
      LAYERS: this._wmsLayerName,
      STYLES: '',
      SRS: this._wmsSrs,
      BBOX: webMercatorBoundsToGeoBbox(bounds),
      WIDTH: String(tileSize),
      HEIGHT: String(tileSize),
      FORMAT: this._wmsFormat,
    });
    return `${this._wmsUrl}?${params.toString()}`;
  }
}
