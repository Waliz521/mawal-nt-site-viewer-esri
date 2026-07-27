import Extent from '@arcgis/core/geometry/Extent';

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
