import { TRAFFIC_LIGHT_BADGE_STYLES } from '../../lib/domain/trafficLight';

export default function TrafficLightBadge({ rating, large = false }) {
  if (!rating) {
    return <span className={`badge badge-muted ${large ? 'badge-lg' : ''}`}>N/A</span>;
  }

  const style = TRAFFIC_LIGHT_BADGE_STYLES[rating] ?? TRAFFIC_LIGHT_BADGE_STYLES.GREEN;

  return (
    <span
      className={`badge ${large ? 'badge-lg' : ''}`}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      {rating}
    </span>
  );
}
