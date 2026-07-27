import { useEffect, useMemo, useState } from 'react';
import SiteCard from '../../components/sites/SiteCard';
import SetupRequired from '../../components/ui/SetupRequired';
import { useSiteBatch } from '../../contexts/SiteBatchContext';
import { fetchSites } from '../../lib/api/supabase';
import { siteMatchesQuery } from '../../lib/domain/search';
import {
  countSitesByBatch,
  filterSitesByBatch,
  SITE_BATCH_GREENFIELD,
} from '../../lib/domain/siteBatches';

export default function HomePage() {
  const { siteBatch, setBatchCounts } = useSiteBatch();
  const [sites, setSites] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSites()
      .then(setSites)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (sites.length === 0) return;
    setBatchCounts(countSitesByBatch(sites));
  }, [sites, setBatchCounts]);

  useEffect(() => {
    setFilter('ALL');
    setQuery('');
  }, [siteBatch]);

  const batchSites = useMemo(() => filterSitesByBatch(sites, siteBatch), [sites, siteBatch]);

  const filtered = useMemo(() => {
    return batchSites.filter((site) => {
      const matchesQuery = siteMatchesQuery(site, query);
      const matchesFilter = filter === 'ALL' || site.traffic_light === filter;
      return matchesQuery && matchesFilter;
    });
  }, [batchSites, query, filter]);

  const queryMatchesIgnoringFilter = useMemo(() => {
    if (!query.trim()) return 0;
    return batchSites.filter((site) => siteMatchesQuery(site, query)).length;
  }, [batchSites, query]);

  const counts = useMemo(() => {
    return batchSites.reduce(
      (acc, s) => {
        acc.total += 1;
        if (s.traffic_light === 'GREEN') acc.green += 1;
        if (s.traffic_light === 'AMBER') acc.amber += 1;
        if (s.traffic_light === 'RED') acc.red += 1;
        return acc;
      },
      { total: 0, green: 0, amber: 0, red: 0 },
    );
  }, [batchSites]);

  const isGreenfield = siteBatch === SITE_BATCH_GREENFIELD;

  if (loading) return <div className="state-msg">Loading sites…</div>;
  if (error) {
    return <SetupRequired message={error} />;
  }

  const showFilterHint =
    query.trim() && filtered.length === 0 && queryMatchesIgnoringFilter > 0 && filter !== 'ALL';

  return (
    <div className="home-page">
      <section className="hero">
        <h1>{isGreenfield ? 'Greenfield community sites' : 'NT community power-station sites'}</h1>
        <p>
          {counts.total} sites with KML profiles · {counts.green} green · {counts.amber} amber ·{' '}
          {counts.red} red
          {isGreenfield ? ' · diesel-only greenfield batch' : ' · existing solar tranche'}
        </p>
      </section>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, region, slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search sites"
        />
        <div className="filter-group">
          {['ALL', 'GREEN', 'AMBER', 'RED'].map((value) => (
            <button
              key={value}
              type="button"
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {value === 'ALL' ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {query.trim() ? (
        <p className="results-hint">
          {filtered.length} result{filtered.length === 1 ? '' : 's'} for &ldquo;{query.trim()}&rdquo;
          {filter !== 'ALL' ? ` (${filter} filter active)` : ''}
        </p>
      ) : null}

      {showFilterHint ? (
        <div className="filter-hint">
          <p>
            {queryMatchesIgnoringFilter} site{queryMatchesIgnoringFilter === 1 ? '' : 's'} match
            your search but not the <strong>{filter}</strong> filter.
          </p>
          <button type="button" onClick={() => setFilter('ALL')}>
            Show all matching sites
          </button>
        </div>
      ) : null}

      <div className="site-grid">
        {filtered.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>

      {filtered.length === 0 && !showFilterHint ? (
        <p className="state-msg">
          {batchSites.length === 0
            ? 'No sites in this batch yet. Run greenfield ingest when profiles are ready.'
            : 'No sites match your search.'}
        </p>
      ) : null}
    </div>
  );
}
