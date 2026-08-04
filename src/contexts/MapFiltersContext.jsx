import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchIndigenousLocationsGeoJson,
  filterIndigenousGeoJson,
  listIndigenousLocations,
} from '../lib/domain/boundaries';
import { LAYER_TYPE_ORDER } from '../lib/domain/layerTypes';
import { fetchAllLayers, fetchSites } from '../lib/api/supabase';
import { countSitesByBatch, filterSitesByBatch } from '../lib/domain/siteBatches';
import {
  boundsFromFeature,
  buildSiteSpatialFootprint,
  siteFootprintIntersectsFeature,
} from '../lib/domain/geojson';
import { useSiteBatch } from './SiteBatchContext';

const MapFiltersContext = createContext(null);

const EMPTY_IDS = [];

/**
 * Operational layers are rebuilt whenever filters change, so their visibility
 * lives here — otherwise every Layers-panel toggle would reset on the next edit.
 */
const DEFAULT_LAYER_VISIBILITY = {
  'nt-boundary': true,
  'indigenous-locations': true,
  'kml-profiles': true,
  'site-markers': true,
};

function computeVisibleLayerIds(layers, visibleSiteIds, visibleTypes) {
  return new Set(
    layers
      .filter((l) => visibleSiteIds.has(l.site_id) && visibleTypes.has(l.layer_type))
      .map((l) => l.id),
  );
}

/**
 * Site → location assignment for every location, computed once per batch.
 * Uses geometry overlap (bbox + polygon vertices/centers), not site centroid
 * alone, so footprints that straddle an ILOC boundary still match.
 */
function buildSiteIdsByLocation(sites, layers, locations) {
  const index = new Map();
  if (sites.length === 0 || locations.length === 0) return index;

  const layersBySite = new Map();
  for (const layer of layers) {
    const list = layersBySite.get(layer.site_id) ?? [];
    list.push(layer);
    layersBySite.set(layer.site_id, list);
  }

  const footprints = sites
    .map((site) => ({
      id: site.id,
      ...buildSiteSpatialFootprint(site, layersBySite.get(site.id) ?? []),
    }))
    .filter((entry) => entry.bounds);

  const locationEntries = locations.map((location) => ({
    code: location.code,
    feature: location.feature,
    bounds: boundsFromFeature(location.feature),
  }));

  for (const location of locationEntries) {
    if (!location.bounds) continue;

    const ids = footprints
      .filter((footprint) =>
        siteFootprintIntersectsFeature(footprint, location.feature, location.bounds),
      )
      .map((footprint) => footprint.id);

    if (ids.length > 0) index.set(location.code, ids);
  }

  return index;
}

export function MapFiltersProvider({ children }) {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  const { siteBatch, setBatchCounts } = useSiteBatch();

  const [allSites, setAllSites] = useState([]);
  const [layers, setLayers] = useState([]);
  const [indigenousGeoJson, setIndigenousGeoJson] = useState(null);
  const [indigenousLocations, setIndigenousLocations] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedIndigenousCode, setSelectedIndigenousCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState(() => new Set(LAYER_TYPE_ORDER));
  const [layerVisibility, setLayerVisibilityState] = useState(DEFAULT_LAYER_VISIBILITY);

  const batchSites = useMemo(
    () => filterSitesByBatch(allSites, siteBatch),
    [allSites, siteBatch],
  );

  const batchSiteIds = useMemo(() => new Set(batchSites.map((site) => site.id)), [batchSites]);

  const batchLayers = useMemo(
    () => layers.filter((layer) => batchSiteIds.has(layer.site_id)),
    [layers, batchSiteIds],
  );

  useEffect(() => {
    if (!isMapPage) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchSites(), fetchAllLayers(), fetchIndigenousLocationsGeoJson()])
      .then(([siteRows, layerRows, indigenousData]) => {
        if (cancelled) return;
        setAllSites(siteRows);
        setLayers(layerRows);
        setIndigenousGeoJson(indigenousData);
        setIndigenousLocations(listIndigenousLocations(indigenousData));

        const initialBatchSites = filterSitesByBatch(siteRows, siteBatch);
        const initialBatchLayers = layerRows.filter((layer) =>
          initialBatchSites.some((site) => site.id === layer.site_id),
        );
        const presentTypes = new Set(initialBatchLayers.map((row) => row.layer_type));
        setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((type) => presentTypes.has(type))));
        setLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMapPage]);

  useEffect(() => {
    if (!loaded) return;

    setSelectedCommunityId('');
    setSelectedIndigenousCode('');

    const presentTypes = new Set(batchLayers.map((row) => row.layer_type));
    setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((type) => presentTypes.has(type))));
  }, [siteBatch, loaded, batchLayers]);

  useEffect(() => {
    if (allSites.length === 0) return;
    setBatchCounts(countSitesByBatch(allSites));
  }, [allSites, setBatchCounts]);

  const siteIdsByLocation = useMemo(
    () => buildSiteIdsByLocation(batchSites, batchLayers, indigenousLocations),
    [batchSites, batchLayers, indigenousLocations],
  );

  const locationOptions = useMemo(
    () =>
      indigenousLocations.map((row) => ({
        code: row.code,
        name: row.name,
        siteCount: siteIdsByLocation.get(row.code)?.length ?? 0,
      })),
    [indigenousLocations, siteIdsByLocation],
  );

  const locationSiteIds = selectedIndigenousCode
    ? (siteIdsByLocation.get(selectedIndigenousCode) ?? EMPTY_IDS)
    : null;

  /** Communities offered in the dropdown: the whole batch, or just this location. */
  const communitySites = useMemo(() => {
    const scoped = locationSiteIds
      ? batchSites.filter((site) => locationSiteIds.includes(site.id))
      : batchSites;

    return [...scoped].sort(
      (a, b) => (a.site_number ?? 999) - (b.site_number ?? 999) || a.name.localeCompare(b.name),
    );
  }, [batchSites, locationSiteIds]);

  // A community that sits outside a newly picked location can't stay selected.
  useEffect(() => {
    if (!selectedCommunityId || !locationSiteIds) return;
    if (!locationSiteIds.includes(selectedCommunityId)) setSelectedCommunityId('');
  }, [selectedCommunityId, locationSiteIds]);

  const visibleSiteIds = useMemo(() => {
    if (selectedCommunityId) return new Set([selectedCommunityId]);
    if (locationSiteIds) return new Set(locationSiteIds);
    return new Set(batchSites.map((site) => site.id));
  }, [selectedCommunityId, locationSiteIds, batchSites]);

  const filteredIndigenousGeoJson = useMemo(
    () => filterIndigenousGeoJson(indigenousGeoJson, selectedIndigenousCode),
    [indigenousGeoJson, selectedIndigenousCode],
  );

  const visibleLayerIds = useMemo(
    () => computeVisibleLayerIds(batchLayers, visibleSiteIds, visibleTypes),
    [batchLayers, visibleSiteIds, visibleTypes],
  );

  const toggleType = useCallback((type) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const showAllTypes = useCallback(() => {
    const presentTypes = new Set(batchLayers.map((row) => row.layer_type));
    setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((type) => presentTypes.has(type))));
  }, [batchLayers]);

  const hideAllTypes = useCallback(() => {
    setVisibleTypes(new Set());
  }, []);

  const setLayerVisibility = useCallback((layerId, visible) => {
    setLayerVisibilityState((prev) =>
      prev[layerId] === visible ? prev : { ...prev, [layerId]: visible },
    );
  }, []);

  const selectCommunity = useCallback((siteId) => {
    setSelectedCommunityId(siteId ?? '');
  }, []);

  const selectIndigenousLocation = useCallback((code) => {
    setSelectedIndigenousCode(code ?? '');
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCommunityId('');
    setSelectedIndigenousCode('');
  }, []);

  const value = useMemo(
    () => ({
      isMapPage,
      sites: batchSites,
      allSites,
      siteBatch,
      layers: batchLayers,
      communitySites,
      indigenousGeoJson,
      indigenousLocations,
      locationOptions,
      selectedCommunityId,
      selectedIndigenousCode,
      locationSiteCount: locationSiteIds?.length ?? null,
      filteredIndigenousGeoJson,
      loading,
      error,
      loaded,
      visibleSiteIds,
      visibleTypes,
      visibleLayerIds,
      layerVisibility,
      toggleType,
      showAllTypes,
      hideAllTypes,
      selectCommunity,
      selectIndigenousLocation,
      clearFilters,
      setLayerVisibility,
    }),
    [
      isMapPage,
      batchSites,
      allSites,
      siteBatch,
      batchLayers,
      communitySites,
      indigenousGeoJson,
      indigenousLocations,
      locationOptions,
      selectedCommunityId,
      selectedIndigenousCode,
      locationSiteIds,
      filteredIndigenousGeoJson,
      loading,
      error,
      loaded,
      visibleSiteIds,
      visibleTypes,
      visibleLayerIds,
      layerVisibility,
      toggleType,
      showAllTypes,
      hideAllTypes,
      selectCommunity,
      selectIndigenousLocation,
      clearFilters,
      setLayerVisibility,
    ],
  );

  return <MapFiltersContext.Provider value={value}>{children}</MapFiltersContext.Provider>;
}

export function useMapFilters() {
  const ctx = useContext(MapFiltersContext);
  if (!ctx) throw new Error('useMapFilters must be used within MapFiltersProvider');
  return ctx;
}

export function useMapFiltersOptional() {
  return useContext(MapFiltersContext);
}
