import Expand from '@arcgis/core/widgets/Expand';
import Zoom from '@arcgis/core/widgets/Zoom';
import LayerList from '@arcgis/core/widgets/LayerList';
import Legend from '@arcgis/core/widgets/Legend';
import Measurement from '@arcgis/core/widgets/Measurement';
import NavigationToggle from '@arcgis/core/widgets/NavigationToggle';
import Compass from '@arcgis/core/widgets/Compass';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { BASEMAP_OPTIONS } from './basemaps';
import {
  createViewModeToggleButton,
  setViewModeToggleLabel,
} from './viewModeToggle';

function createBasemapPicker(map) {
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
        map.basemap = option.create();
        activeId = option.id;
        render();
      });
      root.appendChild(btn);
    }
  }

  render();
  return root;
}

/**
 * Mount overview map widgets on MapView or SceneView.
 * Returns hosts for React portals + destroy() for view swaps.
 */
export function mountOverviewMapUi({
  view,
  map,
  is3D = false,
  onViewModeToggle,
  onFiltersHost,
  onLayersHost,
}) {
  const destroys = [];
  const expands = [];

  view.ui.add(new Zoom({ view }), 'top-left');

  if (is3D) {
    view.ui.add(new NavigationToggle({ view }), 'top-left');
    view.ui.add(new Compass({ view }), 'top-left');
  }

  const viewModeButton = createViewModeToggleButton((button) => onViewModeToggle?.(button));
  setViewModeToggleLabel(viewModeButton, is3D);
  view.ui.add(viewModeButton, 'top-left');

  if (!is3D) {
    const measurement = new Measurement({ view });
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
    destroys.push(() => {
      measureExpandedHandle?.remove?.();
      measurement.clear();
      measurement.activeTool = null;
      measurement.destroy();
    });
  }

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
  onLayersHost?.(layerTypesNode);

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
  onFiltersHost?.(filtersNode);

  const basemapExpand = new Expand({
    view,
    content: createBasemapPicker(map),
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

  return {
    viewModeButton,
    destroy() {
      onFiltersHost?.(null);
      onLayersHost?.(null);
      for (const fn of destroys) fn();
      for (const expand of expands) expand.destroy();
      layerList.destroy();
      view.ui.remove(viewModeButton);
    },
  };
}
