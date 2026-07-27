import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { createEsriImageryBasemap } from '../../lib/arcgis/basemaps';
import { buildFeatureCollection } from '../../lib/arcgis/layerStyles';
import {
  createGeoJsonLayer,
  createIndigenousGraphicsLayer,
  createNtBoundaryLayer,
  createSiteMarkersLayer,
  revokeBlobUrl,
} from '../../lib/arcgis/geoJsonLayers';
import { boundsFromFeature, boundsFromLayers, extentFromBounds } from '../../lib/domain/geojson';
import { toExtent, goToNtDefaultView, safeGoTo } from '../../lib/arcgis/extent';
import { NT_CENTER, NT_ZOOM } from '../../lib/arcgis/config';
import { mountOverviewMapUi } from '../../lib/arcgis/overviewMapUi';
import { swapMapSceneViews } from '../../lib/arcgis/viewModeToggle';
import MapFiltersWidget from './MapFiltersWidget';
import MapLayersWidget from './MapLayersWidget';

const NT_BOUNDARY_STYLE = {
  fillColor: [255, 255, 255, 0.03],
  outlineColor: [0, 0, 0, 0.95],
  outlineWidth: 2.5,
};

const INDIGENOUS_STYLE = {
  fillColor: [251, 191, 36, 0.07],
  outlineColor: [0, 0, 0, 0.9],
  outlineWidth: 1.75,
};

const INDIGENOUS_SELECTED_STYLE = {
  fillColor: [56, 189, 248, 0.18],
  outlineColor: [8, 145, 178, 1],
  outlineWidth: 3,
};

const OPERATIONAL_LAYER_IDS = [
  'kml-profiles',
  'site-markers',
  'nt-boundary',
  'indigenous-locations',
  'indigenous-selected',
];

function removeOperationalLayers(map) {
  for (const id of OPERATIONAL_LAYER_IDS) {
    const layer = map.findLayerById(id);
    if (layer) {
      map.remove(layer);
      layer.destroy?.();
    }
    if (id !== 'nt-boundary') revokeBlobUrl(id);
  }
}

export default function OverviewArcGISMap({
  sites = [],
  layers = [],
  visibleLayerIds = new Set(),
  visibleSiteIds = new Set(),
  visibleTypes = new Set(),
  layerVisibility = {},
  indigenousGeoJson = null,
  selectedIndigenousGeoJson = null,
  communitySites = [],
  locationOptions = [],
  selectedCommunityId = '',
  selectedIndigenousCode = '',
  locationSiteCount = null,
  indigenousLocations = [],
  siteBatch,
  selectCommunity,
  selectIndigenousLocation,
  clearFilters,
  toggleType,
  showAllTypes,
  hideAllTypes,
  setLayerVisibility,
  mapResetKey,
}) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const viewsRef = useRef(null);
  const mapUiRef = useRef(null);
  const is3DRef = useRef(false);
  const [filtersHost, setFiltersHost] = useState(null);
  const [layersHost, setLayersHost] = useState(null);
  const [ready, setReady] = useState(false);

  // Read at layer-creation time so a visibility change alone never rebuilds layers.
  const layerVisibilityRef = useRef(layerVisibility);
  layerVisibilityRef.current = layerVisibility;

  // Keeps the zoom effect keyed on the selection only — a data refresh must not
  // yank a user who has panned away.
  const dataRef = useRef(null);
  dataRef.current = { sites, layers, locations: indigenousLocations };

  const featureCollection = useMemo(
    () => buildFeatureCollection(layers, visibleLayerIds),
    [layers, visibleLayerIds],
  );

  const filterPanel = (
    <MapFiltersWidget
      siteCount={sites.length}
      visibleCount={visibleSiteIds.size}
      communitySites={communitySites}
      locationOptions={locationOptions}
      selectedCommunityId={selectedCommunityId}
      selectedIndigenousCode={selectedIndigenousCode}
      locationSiteCount={locationSiteCount}
      siteBatch={siteBatch}
      selectCommunity={selectCommunity}
      selectIndigenousLocation={selectIndigenousLocation}
      clearFilters={clearFilters}
    />
  );

  const layersPanel = (
    <MapLayersWidget
      layers={layers}
      visibleSiteIds={visibleSiteIds}
      visibleTypes={visibleTypes}
      toggleType={toggleType}
      showAllTypes={showAllTypes}
      hideAllTypes={hideAllTypes}
    />
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;

    const map = new Map({
      basemap: createEsriImageryBasemap(),
    });

    const mapView = new MapView({
      container,
      map,
      center: NT_CENTER,
      zoom: NT_ZOOM,
      constraints: { snapToZoom: false },
      ui: { components: [] },
      popup: { dockEnabled: true, dockOptions: { position: 'bottom-right' } },
    });

    function createSceneView() {
      map.ground = 'world-elevation';
      return new SceneView({
        container: null,
        map,
        center: NT_CENTER,
        zoom: NT_ZOOM,
        viewingMode: 'global',
        ui: { components: [] },
        environment: {
          atmosphereEnabled: true,
          starsEnabled: false,
        },
        popup: { dockEnabled: true, dockOptions: { position: 'bottom-right' } },
      });
    }

    viewsRef.current = { map, mapView, sceneView: null, container, createSceneView };
    viewRef.current = mapView;
    is3DRef.current = false;

    function mountUi(activeView, is3D) {
      mapUiRef.current?.destroy();
      mapUiRef.current = mountOverviewMapUi({
        view: activeView,
        map,
        is3D,
        onFiltersHost: setFiltersHost,
        onLayersHost: setLayersHost,
        onViewModeToggle: async () => {
          const views = viewsRef.current;
          if (!views || cancelled) return;

          const to3D = !is3DRef.current;
          if (to3D && !views.sceneView) {
            views.sceneView = views.createSceneView();
          }
          if (!views.sceneView) return;

          mapUiRef.current?.destroy();
          mapUiRef.current = null;
          setFiltersHost(null);
          setLayersHost(null);

          const activeViewNext = await swapMapSceneViews({
            mapView: views.mapView,
            sceneView: views.sceneView,
            container: views.container,
            to3D,
          });

          is3DRef.current = to3D;
          viewRef.current = activeViewNext;
          mountUi(activeViewNext, to3D);
        },
      });
    }

    mountUi(mapView, false);

    Promise.all([mapView.when(), map.basemap.load()])
      .then(() => {
        if (cancelled) return;
        setReady(true);
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          console.error('Overview map failed to initialize', error);
        }
      });

    return () => {
      cancelled = true;
      mapUiRef.current?.destroy();
      mapUiRef.current = null;
      viewRef.current = null;
      viewsRef.current = null;
      setReady(false);
      setFiltersHost(null);
      setLayersHost(null);
      mapView.destroy();
      viewsRef.current?.sceneView?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!ready || !viewRef.current) return undefined;

    const map = viewRef.current.map;
    const handles = [];
    removeOperationalLayers(map);

    // The LayerList writes straight to layer.visible; mirror it back into React
    // state so the choice survives the next rebuild.
    function addLayer(layer) {
      if (!layer) return;
      layer.visible = layerVisibilityRef.current[layer.id] ?? true;
      handles.push(
        reactiveUtils.watch(
          () => layer.visible,
          (visible) => setLayerVisibility?.(layer.id, visible),
        ),
      );
      map.add(layer);
    }

    addLayer(createNtBoundaryLayer(NT_BOUNDARY_STYLE));
    addLayer(createIndigenousGraphicsLayer(indigenousGeoJson, INDIGENOUS_STYLE));

    // Selected location stays highlighted on top of the full boundary set.
    const selectedLayer = createIndigenousGraphicsLayer(
      selectedIndigenousGeoJson,
      INDIGENOUS_SELECTED_STYLE,
      { id: 'indigenous-selected', title: 'Selected location', listMode: 'hide' },
    );
    if (selectedLayer) map.add(selectedLayer);

    addLayer(createGeoJsonLayer(featureCollection, 'kml-profiles', 'KML profiles'));
    addLayer(createSiteMarkersLayer(sites, layers, visibleSiteIds, 'site-markers'));

    return () => {
      for (const handle of handles) handle.remove();
      removeOperationalLayers(map);
    };
  }, [
    ready,
    featureCollection,
    sites,
    layers,
    visibleSiteIds,
    indigenousGeoJson,
    selectedIndigenousGeoJson,
    setLayerVisibility,
  ]);

  useEffect(() => {
    if (!ready || !viewRef.current) return;

    const map = viewRef.current.map;
    for (const [id, visible] of Object.entries(layerVisibility)) {
      const layer = map.findLayerById(id);
      if (layer && layer.visible !== visible) layer.visible = visible;
    }
  }, [ready, layerVisibility]);

  // Narrowest active filter wins, so clearing a community falls back to its
  // location rather than jumping all the way out to the Territory.
  useEffect(() => {
    if (!ready || !viewRef.current) return;

    const { sites: allSites, layers: allLayers, locations } = dataRef.current;
    const view = viewRef.current;

    if (selectedCommunityId) {
      const site = allSites.find((row) => row.id === selectedCommunityId);
      const siteLayers = allLayers.filter((layer) => layer.site_id === selectedCommunityId);
      const extent = toExtent(extentFromBounds(boundsFromLayers(siteLayers)));

      if (extent) {
        safeGoTo(view, { target: extent, padding: 48 });
        return;
      }
      if (site?.lng != null && site?.lat != null) {
        safeGoTo(view, { center: [site.lng, site.lat], zoom: 15 });
        return;
      }
    }

    if (selectedIndigenousCode) {
      const location = locations.find((row) => row.code === selectedIndigenousCode);
      const extent = toExtent(extentFromBounds(boundsFromFeature(location?.feature)));
      if (extent) {
        safeGoTo(view, { target: extent, padding: 40 });
        return;
      }
    }

    goToNtDefaultView(view);
  }, [ready, selectedCommunityId, selectedIndigenousCode, mapResetKey]);

  return (
    <div className="arcgis-map arcgis-map-full">
      <div ref={containerRef} className="arcgis-map-container" />
      {!ready ? <div className="arcgis-map-loading">Loading map…</div> : null}
      {filtersHost ? createPortal(filterPanel, filtersHost) : null}
      {layersHost ? createPortal(layersPanel, layersHost) : null}
    </div>
  );
}
