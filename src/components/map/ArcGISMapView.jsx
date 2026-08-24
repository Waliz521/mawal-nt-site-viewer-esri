import { useEffect, useMemo, useState } from 'react';
import Expand from '@arcgis/core/widgets/Expand';
import { useArcGISMap } from '../../hooks/useArcGISMap';
import { createBasemapPicker } from '../../lib/arcgis/basemapPicker';
import { buildFeatureCollection } from '../../lib/arcgis/layerStyles';
import {
  createGeoJsonLayer,
  createSiteMarkersLayer,
  revokeAllBlobUrls,
} from '../../lib/arcgis/geoJsonLayers';
import { extentFromBounds } from '../../lib/domain/geojson';
import { reportGoToError, toExtent } from '../../lib/arcgis/extent';
import MapAttributionBar from './MapAttributionBar';

export default function ArcGISMapView({
  className = 'arcgis-map',
  sites = [],
  layers = [],
  visibleLayerIds = new Set(),
  layerId = 'overview-layers',
  showSiteMarkers = true,
  showBasemapPicker = false,
  extentBounds = null,
  center = null,
  zoom = null,
}) {
  const [activeBasemapId, setActiveBasemapId] = useState('world-imagery');
  const { containerRef, view, ready } = useArcGISMap({ center, zoom });

  const featureCollection = useMemo(
    () => buildFeatureCollection(layers, visibleLayerIds),
    [layers, visibleLayerIds],
  );

  const visibleSites = useMemo(() => {
    if (!showSiteMarkers) return [];
    const siteIdsWithLayers = new Set(
      layers.filter((l) => visibleLayerIds.has(l.id)).map((l) => l.site_id),
    );
    return sites.filter((site) => siteIdsWithLayers.has(site.id) || visibleLayerIds.size === 0);
  }, [sites, layers, visibleLayerIds, showSiteMarkers]);

  useEffect(() => {
    if (!ready || !view || !showBasemapPicker) return undefined;

    const basemapExpand = new Expand({
      view,
      content: createBasemapPicker(view.map, { onSelect: setActiveBasemapId }),
      expandIcon: 'basemap',
      expandTooltip: 'Basemap',
      group: 'top-right',
    });
    view.ui.add(basemapExpand, 'top-right');

    return () => {
      basemapExpand.destroy();
    };
  }, [ready, view, showBasemapPicker]);

  useEffect(() => {
    if (!ready || !view) return undefined;

    const map = view.map;
    const layerKeys = [layerId, 'site-markers'];

    for (const key of layerKeys) {
      const existing = map.findLayerById(key);
      if (existing) map.remove(existing);
    }

    if (featureCollection.features.length > 0) {
      const geoLayer = createGeoJsonLayer(featureCollection, layerId);
      map.add(geoLayer);
    }

    if (showSiteMarkers && visibleSites.length > 0) {
      const markers = createSiteMarkersLayer(
        visibleSites,
        layers,
        new Set(visibleSites.map((site) => site.id)),
        'site-markers',
      );
      if (markers) map.add(markers);
    }

    return undefined;
  }, [ready, view, featureCollection, layerId, layers, visibleSites, showSiteMarkers]);

  useEffect(() => () => revokeAllBlobUrls(), []);

  useEffect(() => {
    if (!ready || !view) return;

    const extent = toExtent(extentFromBounds(extentBounds));
    if (extent) {
      view.goTo({ target: extent, padding: 48 }).catch(reportGoToError);
      return;
    }

    if (center) {
      view.goTo({ center, zoom: zoom ?? 14 }).catch(reportGoToError);
    }
  }, [ready, view, extentBounds, center, zoom]);

  return (
    <div className={className}>
      <div ref={containerRef} className="arcgis-map-container" />
      {!ready ? <div className="arcgis-map-loading">Loading map…</div> : null}
      <MapAttributionBar basemapId={activeBasemapId} />
    </div>
  );
}
