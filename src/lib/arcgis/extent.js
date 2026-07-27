import Extent from '@arcgis/core/geometry/Extent';
import { NT_CENTER, NT_VIEW_PADDING, NT_ZOOM } from './config';

/** ~450 m — a single compound fence is otherwise too small to be a valid target. */
const MIN_SPAN_DEG = 0.004;

/**
 * `view.goTo` needs a real geometry instance: plain `{ xmin, … }` JSON is not
 * autocast, and the resulting rejection is easy to miss because callers catch it.
 */
export function toExtent(extentJson) {
  if (!extentJson) return null;

  const { xmin, ymin, xmax, ymax, spatialReference = { wkid: 4326 } } = extentJson;
  if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return null;

  const padX = Math.max(0, (MIN_SPAN_DEG - (xmax - xmin)) / 2);
  const padY = Math.max(0, (MIN_SPAN_DEG - (ymax - ymin)) / 2);

  return new Extent({
    xmin: xmin - padX,
    ymin: ymin - padY,
    xmax: xmax + padX,
    ymax: ymax + padY,
    spatialReference,
  });
}

/** Aborted animations are expected whenever a newer goTo supersedes an older one. */
export function reportGoToError(error) {
  if (error?.name === 'AbortError') return;
  console.warn('Map navigation failed', error);
}

/** MapView/SceneView must be mounted in a container before goTo is safe. */
export function canNavigateView(view) {
  return Boolean(view && !view.destroyed && view.ready && view.container);
}

export function safeGoTo(view, target) {
  if (!canNavigateView(view)) return Promise.resolve();
  return view.goTo(target).catch(reportGoToError);
}

/** Default overview position — uses NT_CENTER + NT_ZOOM from config (not extent fit). */
export function goToNtDefaultView(view) {
  return safeGoTo(view, { center: NT_CENTER, zoom: NT_ZOOM, padding: NT_VIEW_PADDING });
}
