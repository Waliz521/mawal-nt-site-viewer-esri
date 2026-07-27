/**
 * Calcite reads `globalThis.calciteConfig` once, when its runtime module first
 * evaluates — so this must be imported before any ArcGIS/Calcite module.
 *
 * ArcGIS 4.32 widgets (LayerList, Expand) still set Calcite's deprecated `open`
 * property internally, which floods the console with warnings we cannot fix.
 * Errors are still logged.
 */
globalThis.calciteConfig = {
  ...(globalThis.calciteConfig ?? {}),
  logLevel: 'error',
};

export {};
