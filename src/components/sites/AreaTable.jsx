import { layerTypeLabel, LAYER_TYPE_ORDER } from '../../lib/domain/layerTypes';
import { formatAreaHa, formatAreaM2 } from '../../lib/domain/format';

export default function AreaTable({ layers, visibleTypes, onToggleType }) {
  const grouped = LAYER_TYPE_ORDER.filter((type) => layers.some((l) => l.layer_type === type));

  return (
    <section className="panel area-panel">
      <h2>Polygon areas</h2>

      <div className="layer-toggles">
        {grouped.map((type) => {
          const sample = layers.find((l) => l.layer_type === type);
          const checked = visibleTypes.has(type);
          return (
            <label key={type} className="layer-toggle">
              <input type="checkbox" checked={checked} onChange={() => onToggleType(type)} />
              <span className="swatch" style={{ background: sample?.color_hex ?? '#999' }} />
              <span>{layerTypeLabel(type)}</span>
            </label>
          );
        })}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Type</th>
              <th className="num">Area (m²)</th>
              <th className="num">Area (ha)</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((layer) => (
              <tr key={layer.id} className={visibleTypes.has(layer.layer_type) ? '' : 'row-muted'}>
                <td>
                  <span className="swatch inline" style={{ background: layer.color_hex }} />
                  {layer.layer_name}
                </td>
                <td>{layerTypeLabel(layer.layer_type)}</td>
                <td className="num">{formatAreaM2(layer.area_m2)}</td>
                <td className="num">{formatAreaHa(layer.area_ha)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
