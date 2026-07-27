import { TRAFFIC_LIGHT_COLORS } from '../domain/trafficLight';

export const MARKER_MIN_SIZE = 9;
export const MARKER_MAX_SIZE = 32;
export const MARKER_SIZE_STEPS = 4;

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function hexToRgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return [r, g, b, alpha];
}

export function siteMarkerSymbolForRating(rating) {
  const colors = TRAFFIC_LIGHT_COLORS[rating] ?? { fill: '#64748b', stroke: '#334155' };
  return {
    type: 'simple-marker',
    color: hexToRgba(colors.fill, 0.92),
    size: MARKER_MIN_SIZE,
    outline: { color: hexToRgb(colors.stroke), width: 1.5 },
  };
}

export function clusterMarkerSymbol() {
  return {
    type: 'simple-marker',
    color: [15, 118, 110, 0.92],
    size: 26,
    outline: { color: [255, 255, 255, 0.9], width: 1.5 },
  };
}

/** Symbol area — not diameter — should track the target, otherwise a site twice the size looks four times bigger. */
export function targetKwWidthStops(values) {
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
      label: `${Math.round(value).toLocaleString()} kWac`,
    };
  });
}
