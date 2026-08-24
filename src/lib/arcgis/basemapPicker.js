import { BASEMAP_OPTIONS } from './basemaps';

/** Custom picker — creates a fresh Basemap on each click (avoids destroyed instances). */
export function createBasemapPicker(map, { onSelect } = {}) {
  const root = document.createElement('div');
  root.className = 'basemap-picker esri-widget';

  let activeId = map.basemap?.id ?? 'world-imagery';

  function render() {
    root.replaceChildren();
    for (const option of BASEMAP_OPTIONS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `basemap-picker__btn${option.id === activeId ? ' is-active' : ''}`;
      btn.textContent = option.title;
      btn.addEventListener('click', () => {
        const basemap = option.create();
        map.basemap = basemap;
        activeId = option.id;
        onSelect?.(option.id);
        render();
        basemap.load().catch((error) => {
          console.error(`Basemap "${option.title}" failed to load`, error);
        });
      });
      root.appendChild(btn);
    }
  }

  render();
  return root;
}
