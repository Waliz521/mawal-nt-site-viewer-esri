import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { createEsriImageryBasemap } from '../lib/arcgis/basemaps';
import { addAttributionWidget } from '../lib/arcgis/mapAttribution';
import { toExtent } from '../lib/arcgis/extent';
import { NT_CENTER, NT_EXTENT, NT_ZOOM } from '../lib/arcgis/config';

export function useArcGISMap({ center = NT_CENTER, zoom = NT_ZOOM, extent = null } = {}) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const [view, setView] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let attribution = null;
    const map = new Map({ basemap: createEsriImageryBasemap() });
    const mapView = new MapView({
      container,
      map,
      center,
      zoom,
      constraints: { snapToZoom: false },
      ui: { components: [] },
      popup: { dockEnabled: true, dockOptions: { position: 'bottom-right' } },
    });

    viewRef.current = mapView;
    attribution = addAttributionWidget(mapView, 'bottom-right');

    Promise.all([mapView.when(), map.basemap.load()])
      .then(() => {
        if (cancelled) return;
        setView(mapView);
        setReady(true);
        return mapView.goTo({ target: toExtent(extent ?? NT_EXTENT), padding: 24 });
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          console.error('Map failed to initialize', error);
        }
      });

    return () => {
      cancelled = true;
      viewRef.current = null;
      attribution?.destroy();
      setReady(false);
      setView(null);
      mapView.destroy();
    };
  }, []);

  return { containerRef, view, ready, viewRef };
}
