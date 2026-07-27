import { useEffect, useRef, useState } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { createEsriImageryBasemap } from '../lib/arcgis/basemaps';
import { goToNtDefaultView, toExtent } from '../lib/arcgis/extent';
import { NT_CENTER, NT_ZOOM } from '../lib/arcgis/config';

export function useArcGISMap({ center = NT_CENTER, zoom = NT_ZOOM, extent = null } = {}) {
  const containerRef = useRef(null);
  const viewRef = useRef(null);
  const [view, setView] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    const map = new Map({ basemap: createEsriImageryBasemap() });
    const mapView = new MapView({
      container,
      map,
      center,
      zoom,
      constraints: { snapToZoom: false },
      popup: { dockEnabled: true, dockOptions: { position: 'bottom-right' } },
    });

    viewRef.current = mapView;

    Promise.all([mapView.when(), map.basemap.load()])
      .then(() => {
        if (cancelled) return;
        setView(mapView);
        setReady(true);
        if (extent) {
          return mapView.goTo({ target: toExtent(extent) });
        }
        return mapView.goTo({ center, zoom });
      })
      .catch((error) => {
        if (!cancelled && error?.name !== 'AbortError') {
          console.error('Map failed to initialize', error);
        }
      });

    return () => {
      cancelled = true;
      viewRef.current = null;
      setReady(false);
      setView(null);
      mapView.destroy();
    };
  }, []);

  return { containerRef, view, ready, viewRef };
}
