import { formatAreaHa, formatAreaM2, formatKwh, formatKw } from '../../lib/domain/format';
import TrafficLightBadge from '../ui/TrafficLightBadge';

export default function SiteMetadata({ site }) {
  return (
    <section className="panel metadata-panel">
      <div className="panel-header">
        <h2>Site metadata</h2>
        <TrafficLightBadge rating={site.traffic_light} />
      </div>

      <dl className="metadata-grid">
        <div>
          <dt>Community</dt>
          <dd>{site.name}</dd>
        </div>
        <div>
          <dt>Region</dt>
          <dd>{site.region ?? '—'}</dd>
        </div>
        <div>
          <dt>Land council</dt>
          <dd>{site.land_council ?? '—'}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            {site.lat != null && site.lng != null
              ? `${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Existing solar</dt>
          <dd>{formatKw(site.existing_solar_kw)}</dd>
        </div>
        <div>
          <dt>Target solar (kWac)</dt>
          <dd>{formatKw(site.target_solar_kwac)}</dd>
        </div>
        <div>
          <dt>Additional solar required</dt>
          <dd>{formatKw(site.additional_solar_kwac)}</dd>
        </div>
        <div>
          <dt>Existing BESS</dt>
          <dd>{formatKwh(site.existing_bess_kwh)}</dd>
        </div>
        <div>
          <dt>Target BESS</dt>
          <dd>{formatKwh(site.target_bess_kwh)}</dd>
        </div>
        <div>
          <dt>Additional BESS required</dt>
          <dd>{formatKwh(site.additional_bess_kwh)}</dd>
        </div>
        {site.imagery_date ? (
          <div>
            <dt>GE imagery date</dt>
            <dd>{site.imagery_date}</dd>
          </div>
        ) : null}
      </dl>

      {site.notes ? (
        <div className="notes-block">
          <h3>Notes</h3>
          <p>{site.notes}</p>
        </div>
      ) : null}

      <div className="formula-hint">
        <strong>Reference formulas</strong>
        <p>Additional solar area = kWac × 7 m²</p>
        <p>BESS footprint = (kWh ÷ 1000) × 150 m²</p>
      </div>
    </section>
  );
}

export function AreaTotals({ layers }) {
  const byType = layers.reduce((acc, layer) => {
    acc[layer.layer_type] = (acc[layer.layer_type] ?? 0) + Number(layer.area_m2);
    return acc;
  }, {});

  const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <section className="panel totals-panel">
      <h2>Area totals by type</h2>
      <ul className="totals-list">
        {entries.map(([type, total]) => (
          <li key={type}>
            <span>{type.replace(/_/g, ' ')}</span>
            <span>{formatAreaM2(total)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
