import { useMemo } from 'react';
import { SITE_BATCH_GREENFIELD } from '../../lib/domain/siteBatches';

export default function MapFiltersWidget({
  siteCount = 0,
  communitySites = [],
  locationOptions = [],
  selectedCommunityId = '',
  selectedIndigenousCode = '',
  locationSiteCount = null,
  visibleCount = 0,
  siteBatch,
  selectCommunity,
  selectIndigenousLocation,
  clearFilters,
}) {
  const isGreenfield = siteBatch === SITE_BATCH_GREENFIELD;
  const hasFilter = Boolean(selectedCommunityId || selectedIndigenousCode);

  // 189 locations, ~25 of which contain a power station — surface those first.
  const [locationsWithSites, otherLocations] = useMemo(() => {
    const withSites = locationOptions.filter((row) => row.siteCount > 0);
    const rest = locationOptions.filter((row) => row.siteCount === 0);
    return [withSites, rest];
  }, [locationOptions]);

  return (
    <div className="map-filters-widget esri-widget">
      <label className="map-filters-field">
        <span className="map-filters-label">Indigenous location</span>
        <select
          className="esri-select map-filters-select"
          value={selectedIndigenousCode}
          onChange={(event) => selectIndigenousLocation(event.target.value)}
        >
          <option value="">All locations</option>
          <optgroup label="With sites">
            {locationsWithSites.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name} ({row.siteCount})
              </option>
            ))}
          </optgroup>
          <optgroup label="No sites">
            {otherLocations.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label className="map-filters-field">
        <span className="map-filters-label">Community</span>
        <select
          className="esri-select map-filters-select"
          value={selectedCommunityId}
          onChange={(event) => selectCommunity(event.target.value)}
          disabled={communitySites.length === 0}
        >
          <option value="">
            {selectedIndigenousCode
              ? `All in this location (${communitySites.length})`
              : 'All communities'}
          </option>
          {communitySites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </label>

      <div className="map-filters-status">
        <span>
          Showing {visibleCount} of {siteCount} sites
        </span>
        {hasFilter ? (
          <button type="button" className="map-filters-link" onClick={clearFilters}>
            Clear
          </button>
        ) : null}
      </div>

      {locationSiteCount === 0 ? (
        <p className="map-filters-footnote">
          No power-station sites fall inside this location.
        </p>
      ) : null}

      {isGreenfield ? (
        <p className="map-filters-footnote">All greenfield sites rated RED (tenure pending)</p>
      ) : null}
    </div>
  );
}
