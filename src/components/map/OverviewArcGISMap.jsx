import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Expand from '@arcgis/core/widgets/Expand';
import Zoom from '@arcgis/core/widgets/Zoom';
import LayerList from '@arcgis/core/widgets/LayerList';
import Legend from '@arcgis/core/widgets/Legend';
import Measurement from '@arcgis/core/widgets/Measurement';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { createEsriImageryBasemap } from '../../lib/arcgis/basemaps';
import { createBasemapPicker } from '../../lib/arcgis/basemapPicker';
import { addAttributionWidget } from '../../lib/arcgis/mapAttribution';
import { buildFeatureCollection } from '../../lib/arcgis/layerStyles';
import {
  createGeoJsonLayer,
  createIndigenousGraphicsLayer,
  createNtBoundaryLayer,
  createSiteMarkersLayer,
  revokeAllBlobUrls,
} from '../../lib/arcgis/geoJsonLayers';
import { boundsForSiteView, boundsFromFeature, extentFromBounds } from '../../lib/domain/geojson';
import { reportGoToError, toExtent } from '../../lib/arcgis/extent';
import { NT_CENTER, NT_EXTENT, NT_ZOOM } from '../../lib/arcgis/config';
import MapFiltersWidget from './MapFiltersWidget';
import MapLayersWidget from './MapLayersWidget';
import MapAttributionBar from './MapAttributionBar';

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
  const measurementRef = useRef(null);
  const [filtersHost, setFiltersHost] = useState(null);
  const [layersHost, setLayersHost] = useState(null);
  const [activeBasemapId, setActiveBasemapId] = useState('world-imagery');
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
    const expands = [];

    // Fresh basemap instance per Map lifecycle — never share module singletons.
    const map = new Map({ basemap: createEsriImageryBasemap() });
    const view = new MapView({
      container,
      map,
      center: NT_CENTER,
      zoom: NT_ZOOM,
      constraints: { snapToZoom: false },
      ui: { components: [] },
      popup: { dockEnabled: true, dockOptions: { position: 'bottom-right' } },
    });

    viewRef.current = view;

    const attribution = addAttributionWidget(view, 'bottom-right');
    expands.push({ destroy: () => attribution.destroy() });

    view.ui.add(new Zoom({ view }), 'top-left');

    // Create Measurement without an active tool — activating before view.ready
    // crashes DistanceMeasurement2D (view.on is undefined).
    const measurement = new Measurement({ view });
    measurementRef.current = measurement;
    const measureExpand = new Expand({
      view,
      content: measurement,
      expandIcon: 'measure',
      expandTooltip: 'Measure',
      group: 'top-right',
    });
    expands.push(measureExpand);
    view.ui.add(measureExpand, 'top-right');

    const measureExpandedHandle = reactiveUtils.watch(
      () => measureExpand.expanded,
      (expanded) => {
        if (expanded) {
          measurement.activeTool = 'distance';
        } else {
          measurement.clear();
          measurement.activeTool = null;
        }
      },
    );

    // Esri's LayerList handles the operational layers; the KML type toggles are
    // rendered underneath it, inside the same Expand.
    const layersNode = document.createElement('div');
    layersNode.className = 'map-panel-host map-layers-panel';
    const layerListNode = document.createElement('div');
    layersNode.appendChild(layerListNode);
    const layerList = new LayerList({ view, container: layerListNode });
    const layerTypesNode = document.createElement('div');
    layersNode.appendChild(layerTypesNode);

    const layersExpand = new Expand({
      view,
      content: layersNode,
      expandIcon: 'layers',
      expandTooltip: 'Layers',
      group: 'top-right',
    });
    expands.push(layersExpand);
    view.ui.add(layersExpand, 'top-right');
    setLayersHost(layerTypesNode);

    const filtersNode = document.createElement('div');
    filtersNode.className = 'map-panel-host';
    const filtersExpand = new Expand({
      view,
      content: filtersNode,
      expandIcon: 'filter',
      expandTooltip: 'Filters',
      group: 'top-right',
    });
    expands.push(filtersExpand);
    view.ui.add(filtersExpand, 'top-right');
    setFiltersHost(filtersNode);

    const basemapExpand = new Expand({
      view,
      content: createBasemapPicker(map, { onSelect: setActiveBasemapId }),
      expandIcon: 'basemap',
      expandTooltip: 'Basemap',
      group: 'top-right',
    });
    expands.push(basemapExpand);
    view.ui.add(basemapExpand, 'top-right');

    const legendExpand = new Expand({
      view,
      content: new Legend({ view }),
      expandIcon: 'legend',
      expandTooltip: 'Legend',
      group: 'bottom-left',
    });
    expands.push(legendExpand);
    view.ui.add(legendExpand, 'bottom-left');

    Promise.all([view.when(), map.basemap.load()])
      .then(() => {
        if (cancelled) return;
        setReady(true);
        return view.goTo({ target: toExtent(NT_EXTENT), padding: 24 });
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          console.error('Overview map failed to initialize', error);
        }
      });

    return () => {
      cancelled = true;
      viewRef.current = null;
      measurementRef.current = null;
      setReady(false);
      setFiltersHost(null);
      setLayersHost(null);
      measureExpandedHandle?.remove?.();
      measurement.clear();
      measurement.activeTool = null;
      for (const expand of expands) expand.destroy();
      layerList.destroy();
      measurement.destroy();
      view.destroy();
      revokeAllBlobUrls();
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
      const extent = toExtent(extentFromBounds(boundsForSiteView(site, siteLayers)));

      if (extent) {
        view.goTo({ target: extent, padding: 48 }).catch(reportGoToError);
        return;
      }
      if (site?.lng != null && site?.lat != null) {
        view.goTo({ center: [site.lng, site.lat], zoom: 15 }).catch(reportGoToError);
        return;
      }
    }

    if (selectedIndigenousCode) {
      const location = locations.find((row) => row.code === selectedIndigenousCode);
      const extent = toExtent(extentFromBounds(boundsFromFeature(location?.feature)));
      if (extent) {
        view.goTo({ target: extent, padding: 40 }).catch(reportGoToError);
        return;
      }
    }

    view.goTo({ target: toExtent(NT_EXTENT), padding: 24 }).catch(reportGoToError);
  }, [ready, selectedCommunityId, selectedIndigenousCode, mapResetKey]);

  return (
    <div className="arcgis-map arcgis-map-full">
      <div ref={containerRef} className="arcgis-map-container" />
      {!ready ? <div className="arcgis-map-loading">Loading map…</div> : null}
      <MapAttributionBar basemapId={activeBasemapId} />
      {filtersHost ? createPortal(filterPanel, filtersHost) : null}
      {layersHost ? createPortal(layersPanel, layersHost) : null}
    </div>
  );
}
