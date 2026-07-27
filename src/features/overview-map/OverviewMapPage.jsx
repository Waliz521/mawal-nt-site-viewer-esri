import { useMemo } from 'react';
import OverviewArcGISMap from '../../components/map/OverviewArcGISMap';
import SetupRequired from '../../components/ui/SetupRequired';
import { useMapFilters } from '../../contexts/MapFiltersContext';

export default function OverviewMapPage() {
  const {
    sites,
    layers,
    loading,
    error,
    visibleLayerIds,
    visibleSiteIds,
    visibleTypes,
    layerVisibility,
    indigenousGeoJson,
    filteredIndigenousGeoJson,
    communitySites,
    locationOptions,
    selectedCommunityId,
    selectedIndigenousCode,
    locationSiteCount,
    indigenousLocations,
    siteBatch,
    selectCommunity,
    selectIndigenousLocation,
    clearFilters,
    toggleType,
    showAllTypes,
    hideAllTypes,
    setLayerVisibility,
  } = useMapFilters();

  const statusCounts = useMemo(() => {
    return sites.reduce(
      (acc, site) => {
        if (!visibleSiteIds.has(site.id)) return acc;
        if (site.traffic_light === 'GREEN') acc.GREEN += 1;
        if (site.traffic_light === 'AMBER') acc.AMBER += 1;
        if (site.traffic_light === 'RED') acc.RED += 1;
        return acc;
      },
      { GREEN: 0, AMBER: 0, RED: 0 },
    );
  }, [sites, visibleSiteIds]);

  if (loading) {
    return <div className="state-msg map-page">Loading all KML layers…</div>;
  }

  if (error) {
    return (
      <div className="map-page">
        <SetupRequired message={error} />
      </div>
    );
  }

  return (
    <div className="map-page">
      <OverviewArcGISMap
        sites={sites}
        layers={layers}
        visibleLayerIds={visibleLayerIds}
        visibleSiteIds={visibleSiteIds}
        visibleTypes={visibleTypes}
        layerVisibility={layerVisibility}
        indigenousGeoJson={indigenousGeoJson}
        selectedIndigenousGeoJson={selectedIndigenousCode ? filteredIndigenousGeoJson : null}
        communitySites={communitySites}
        locationOptions={locationOptions}
        selectedCommunityId={selectedCommunityId}
        selectedIndigenousCode={selectedIndigenousCode}
        locationSiteCount={locationSiteCount}
        indigenousLocations={indigenousLocations}
        siteBatch={siteBatch}
        selectCommunity={selectCommunity}
        selectIndigenousLocation={selectIndigenousLocation}
        clearFilters={clearFilters}
        toggleType={toggleType}
        showAllTypes={showAllTypes}
        hideAllTypes={hideAllTypes}
        setLayerVisibility={setLayerVisibility}
        mapResetKey={siteBatch}
      />
      <span className="visually-hidden" aria-live="polite">
        {statusCounts.GREEN} green, {statusCounts.AMBER} amber, {statusCounts.RED} red sites visible
      </span>
    </div>
  );
}
