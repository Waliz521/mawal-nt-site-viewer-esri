import { layerTypeLabel, LAYER_TYPE_ORDER } from '../../lib/domain/layerTypes';

function typeVisibility(type, layers, visibleSiteIds, visibleTypes) {
  if (!visibleTypes.has(type)) return 'none';

  const typeLayers = layers.filter((l) => l.layer_type === type);
  if (typeLayers.length === 0) return 'none';

  const visibleCount = typeLayers.filter((l) => visibleSiteIds.has(l.site_id)).length;
  if (visibleCount === 0) return 'none';
  if (visibleCount === typeLayers.length) return 'all';
  return 'partial';
}

export default function MapLayersWidget({
  layers = [],
  visibleSiteIds = new Set(),
  visibleTypes = new Set(),
  toggleType,
  showAllTypes,
  hideAllTypes,
}) {
  const layerTypes = LAYER_TYPE_ORDER.filter((type) => layers.some((l) => l.layer_type === type));
  const visibleTypeCount = layerTypes.filter((type) => visibleTypes.has(type)).length;

  const typeCounts = layerTypes.reduce((acc, type) => {
    acc[type] = layers.filter((l) => l.layer_type === type).length;
    return acc;
  }, {});

  return (
    <div className="map-layers-widget esri-widget">
      <section className="map-layers-section">
        <div className="map-layers-heading-row">
          <h3 className="map-layers-heading">
            KML layer types
            <span className="map-layers-summary">
              {visibleTypeCount}/{layerTypes.length}
            </span>
          </h3>
          <div className="map-layers-actions">
            <button type="button" className="map-filters-link" onClick={showAllTypes}>
              All
            </button>
            <span aria-hidden="true" className="map-layers-action-sep">
              ·
            </span>
            <button type="button" className="map-filters-link" onClick={hideAllTypes}>
              None
            </button>
          </div>
        </div>

        <div className="map-layers-list">
          {layerTypes.map((type) => {
            const sample = layers.find((l) => l.layer_type === type);
            const state = typeVisibility(type, layers, visibleSiteIds, visibleTypes);
            return (
              <label key={type} className="map-layers-row">
                <input
                  type="checkbox"
                  checked={state === 'all' || state === 'partial'}
                  ref={(el) => {
                    if (el) el.indeterminate = state === 'partial';
                  }}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    const isOn = visibleTypes.has(type);
                    if (checked !== isOn) toggleType(type);
                  }}
                />
                <span className="swatch" style={{ background: sample?.color_hex ?? '#999' }} />
                <span className="map-layers-name">{layerTypeLabel(type)}</span>
                <span className="map-layers-count">{typeCounts[type]}</span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
