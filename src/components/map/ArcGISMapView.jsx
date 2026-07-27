import { useEffect, useMemo } from 'react';
import { useArcGISMap } from '../../hooks/useArcGISMap';
import { buildFeatureCollection } from '../../lib/arcgis/layerStyles';
import { createGeoJsonLayer, createSiteMarkersLayer, revokeBlobUrl } from '../../lib/arcgis/geoJsonLayers';

export default function ArcGISMapView({
  className = 'arcgis-map',
  sites = [],
  layers = [],
  visibleLayerIds = new Set(),
  layerId = 'overview-layers',
  showSiteMarkers = true,
  center = null,
  zoom = null,
}) {
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

    if (showSiteMarkers && sites.length > 0) {
      const markers = createSiteMarkersLayer(sites, 'site-markers');
      map.add(markers);
    }

    return () => {
      revokeBlobUrl(layerId);
    };
  }, [ready, view, featureCollection, layerId, sites, showSiteMarkers]);

  useEffect(() => {
    if (!ready || !view || !center) return;
    view.goTo({ center, zoom: zoom ?? 14 });
  }, [ready, view, center, zoom]);

  return (
    <div className={className}>
      <div ref={containerRef} className="arcgis-map-container" />
      {!ready ? <div className="arcgis-map-loading">Loading map…</div> : null}
    </div>
  );
}
