export const SITE_BATCH_EXISTING = 'existing';
export const SITE_BATCH_GREENFIELD = 'greenfield';

export const SITE_BATCH_OPTIONS = [
  {
    id: SITE_BATCH_EXISTING,
    label: 'Existing solar',
    description: '27-site tranche with existing solar farms',
  },
  {
    id: SITE_BATCH_GREENFIELD,
    label: 'Greenfield',
    description: 'New-build diesel communities (no existing solar)',
  },
];

const STORAGE_KEY = 'mawal-site-batch';

export function normalizeSiteBatch(value) {
  return value === SITE_BATCH_GREENFIELD ? SITE_BATCH_GREENFIELD : SITE_BATCH_EXISTING;
}

export function readStoredSiteBatch() {
  try {
    return normalizeSiteBatch(localStorage.getItem(STORAGE_KEY));
  } catch {
    return SITE_BATCH_EXISTING;
  }
}

export function writeStoredSiteBatch(batch) {
  try {
    localStorage.setItem(STORAGE_KEY, normalizeSiteBatch(batch));
  } catch {
    // ignore quota / private mode
  }
}

export function filterSitesByBatch(sites, batch) {
  const normalized = normalizeSiteBatch(batch);
  return sites.filter((site) => normalizeSiteBatch(site.site_batch) === normalized);
}

export function countSitesByBatch(sites) {
  return sites.reduce(
    (acc, site) => {
      const batch = normalizeSiteBatch(site.site_batch);
      acc[batch] = (acc[batch] ?? 0) + 1;
      return acc;
    },
    { [SITE_BATCH_EXISTING]: 0, [SITE_BATCH_GREENFIELD]: 0 },
  );
}
