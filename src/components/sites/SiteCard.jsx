import { Link } from 'react-router-dom';
import { formatKwh, formatKw } from '../../lib/domain/format';
import TrafficLightBadge from '../ui/TrafficLightBadge';

export default function SiteCard({ site }) {
  if (!site.slug) {
    return (
      <article className="site-card site-card-disabled">
        <div className="site-card-top">
          <span className="site-number">Site {site.site_number ?? '—'}</span>
          <TrafficLightBadge rating={site.traffic_light} />
        </div>
        <h2>{site.name}</h2>
        <p className="site-meta">Missing slug — re-run ingest</p>
      </article>
    );
  }

  return (
    <Link
      to={`/sites/${site.slug}`}
      className={`site-card site-card--${(site.traffic_light ?? 'unknown').toLowerCase()}`}
    >
      <div className="site-card-top">
        <span className="site-number">Site {site.site_number ?? '—'}</span>
        <TrafficLightBadge rating={site.traffic_light} />
      </div>
      <h2>{site.name}</h2>
      <p className="site-meta">
        {site.region ?? 'NT'}
        {site.land_council ? ` · ${site.land_council}` : ''}
      </p>
      <div className="site-stats">
        <div>
          <span>Solar (existing)</span>
          <strong>{formatKw(site.existing_solar_kw)}</strong>
        </div>
        <div>
          <span>Solar (target)</span>
          <strong>{formatKw(site.target_solar_kwac)}</strong>
        </div>
        <div>
          <span>BESS (existing)</span>
          <strong>{formatKwh(site.existing_bess_kwh)}</strong>
        </div>
        <div>
          <span>BESS (target)</span>
          <strong>{formatKwh(site.target_bess_kwh)}</strong>
        </div>
      </div>
    </Link>
  );
}
