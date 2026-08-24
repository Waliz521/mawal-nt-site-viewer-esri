import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AreaTable from '../../components/sites/AreaTable';
import SiteMetadata, { AreaTotals } from '../../components/sites/SiteMetadata';
import ArcGISMapView from '../../components/map/ArcGISMapView';
import TrafficLightBadge from '../../components/ui/TrafficLightBadge';
import { useSiteBatch } from '../../contexts/SiteBatchContext';
import { fetchSiteBySlug, fetchSiteLayers } from '../../lib/api/supabase';
import { boundsFromLayers } from '../../lib/domain/geojson';
import { LAYER_TYPE_ORDER } from '../../lib/domain/layerTypes';
import { normalizeSiteBatch, SITE_BATCH_GREENFIELD } from '../../lib/domain/siteBatches';

export default function SiteDetailPage() {
  const { slug } = useParams();
  const { setSiteBatch } = useSiteBatch();
  const [site, setSite] = useState(null);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialVisible = useMemo(() => new Set(LAYER_TYPE_ORDER), []);
  const [visibleTypes, setVisibleTypes] = useState(initialVisible);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchSiteBySlug(slug)
      .then(async (siteRow) => {
        if (!siteRow) throw new Error('Site not found');
        setSite(siteRow);
        const layerRows = await fetchSiteLayers(siteRow.id);
        setLayers(layerRows);

        const presentTypes = new Set(layerRows.map((l) => l.layer_type));
        setVisibleTypes(new Set(LAYER_TYPE_ORDER.filter((t) => presentTypes.has(t))));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!site?.site_batch) return;
    setSiteBatch(normalizeSiteBatch(site.site_batch));
  }, [site?.site_batch, setSiteBatch]);

  const visibleLayerIds = useMemo(
    () => new Set(layers.filter((l) => visibleTypes.has(l.layer_type)).map((l) => l.id)),
    [layers, visibleTypes],
  );

  const mapExtentBounds = useMemo(() => {
    const visibleLayers = layers.filter((layer) => visibleLayerIds.has(layer.id));
    return boundsFromLayers(visibleLayers);
  }, [layers, visibleLayerIds]);

  function toggleType(type) {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (loading) return <div className="state-msg">Loading site…</div>;

  if (error || !site) {
    return (
      <div className="state-msg error">
        <h2>Site not available</h2>
        <p>{error ?? 'Not found'}</p>
        <Link to="/">← Back to all sites</Link>
      </div>
    );
  }

  const isGreenfield = normalizeSiteBatch(site.site_batch) === SITE_BATCH_GREENFIELD;
  const mapCenter = site.lng != null && site.lat != null ? [site.lng, site.lat] : null;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <Link to="/" className="back-link">
          ← {isGreenfield ? 'Greenfield sites' : 'Existing solar sites'}
        </Link>
        <div className="detail-title">
          <div>
            <span className="site-number">
              {isGreenfield ? 'Greenfield' : 'Site'} {site.site_number ?? '—'}
            </span>
            <h1>{site.name}</h1>
            <p className="site-meta">
              {site.region ?? 'NT'}
              {site.land_council ? ` · ${site.land_council}` : ''}
            </p>
          </div>
          <TrafficLightBadge rating={site.traffic_light} large />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-map-wrap">
          <ArcGISMapView
            className="arcgis-map arcgis-map-detail"
            sites={[site]}
            layers={layers}
            visibleLayerIds={visibleLayerIds}
            layerId={`site-${site.id}-layers`}
            showSiteMarkers={false}
            showBasemapPicker
            extentBounds={mapExtentBounds}
            center={mapCenter}
            zoom={16}
          />
        </div>

        <div className="detail-panels">
          <SiteMetadata site={site} />
          <AreaTotals layers={layers} />
          <AreaTable layers={layers} visibleTypes={visibleTypes} onToggleType={toggleType} />
        </div>
      </div>
    </div>
  );
}
