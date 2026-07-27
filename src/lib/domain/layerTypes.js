export const LAYER_TYPE_LABELS = {
  fence: 'Compound fence',
  existing_solar: 'Existing solar',
  proposed_solar: 'Proposed solar',
  bess: 'Proposed BESS',
  generators: 'Generators',
  storage: 'Storage / tanks',
  tbc: 'TBC structures',
  purple: 'Practical buildable',
  cyan: 'Outside fence (shortfall)',
  other: 'Other',
};

export const LAYER_TYPE_ORDER = [
  'fence',
  'existing_solar',
  'proposed_solar',
  'bess',
  'generators',
  'storage',
  'tbc',
  'purple',
  'cyan',
  'other',
];

export function layerTypeLabel(type) {
  return LAYER_TYPE_LABELS[type] ?? type;
}
