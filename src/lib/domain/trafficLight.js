/** Traffic-light colours for badges and map markers. */
export const TRAFFIC_LIGHT_COLORS = {
  GREEN: { fill: '#16a34a', stroke: '#14532d', label: 'Green' },
  AMBER: { fill: '#d97706', stroke: '#92400e', label: 'Amber' },
  RED: { fill: '#dc2626', stroke: '#991b1b', label: 'Red' },
};

export const TRAFFIC_LIGHT_BADGE_STYLES = {
  GREEN: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  AMBER: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  RED: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

export function trafficLightMarkerStyle(rating) {
  return TRAFFIC_LIGHT_COLORS[rating] ?? { fill: '#64748b', stroke: '#334155', label: 'N/A' };
}
