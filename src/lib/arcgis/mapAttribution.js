import Attribution from '@arcgis/core/widgets/Attribution';

/** Esri default attribution is removed when MapView uses ui.components = []. */
export function addAttributionWidget(view, position = 'bottom-right') {
  const widget = new Attribution({ view });
  view.ui.add(widget, position);
  return widget;
}
