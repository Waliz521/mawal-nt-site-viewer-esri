import { useMapFiltersOptional } from '../../contexts/MapFiltersContext';

export default function MapHeaderFilters() {
  const filters = useMapFiltersOptional();

  if (!filters?.isMapPage) return null;

  const { loading, error, sites, layers, visibleLayerIds } = filters;

  if (loading) {
    return <span className="header-filter-label">Loading map data…</span>;
  }

  if (error) {
    return <span className="header-filter-label">Map data error</span>;
  }

  return (
    <div className="header-filters" aria-label="Map summary">
      <span className="header-filter-label">
        {sites.length} sites · {visibleLayerIds.size}/{layers.length} layers visible
      </span>
    </div>
  );
}
