import { safeGoTo } from './extent';

/** Scale factor when moving a viewpoint between MapView and SceneView (Web Mercator). */
function scaleFactorForViewpoint(viewpoint) {
  const lat = viewpoint?.targetGeometry?.latitude;
  if (lat == null || !Number.isFinite(lat)) return 1;
  return Math.cos((lat * Math.PI) / 180);
}

/**
 * Swap the DOM container between MapView and SceneView (Esri recommended pattern).
 * Returns the view that is now active.
 */
export async function swapMapSceneViews({ mapView, sceneView, container, to3D }) {
  const fromView = to3D ? mapView : sceneView;
  const toView = to3D ? sceneView : mapView;

  const viewpoint = fromView.viewpoint?.clone?.();
  fromView.container = null;

  if (viewpoint) {
    const factor = scaleFactorForViewpoint(viewpoint);
    if (to3D) {
      viewpoint.scale *= factor;
    } else {
      viewpoint.scale /= factor;
    }
    toView.viewpoint = viewpoint;
  }

  toView.container = container;
  await toView.when();

  if (to3D) {
    await safeGoTo(toView, { tilt: 55, heading: 0 });
  } else {
    await safeGoTo(toView, { tilt: 0, heading: 0 });
  }

  return toView;
}

/** Icon-only button matching other Esri map widgets (Zoom, etc.). */
export function createViewModeToggleButton(onToggle) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'esri-widget esri-widget--button esri-interactive';
  button.title = 'Switch to 3D scene';
  button.setAttribute('aria-label', button.title);
  button.innerHTML = '<span class="esri-icon-globe" aria-hidden="true"></span>';

  button.addEventListener('click', () => {
    onToggle(button);
  });

  return button;
}

export function setViewModeToggleLabel(button, is3D) {
  if (!button) return;
  button.title = is3D ? 'Switch to 2D map' : 'Switch to 3D scene';
  button.setAttribute('aria-label', button.title);
  const icon = button.querySelector('span');
  if (icon) {
    icon.className = is3D ? 'esri-icon-map' : 'esri-icon-globe';
  }
}
