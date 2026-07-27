export function normalizeForSearch(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^a-z0-9]+/g, '');
}

export function siteMatchesQuery(site, rawQuery) {
  const q = rawQuery.trim();
  if (!q) return true;

  const qLower = q.toLowerCase();
  const qNorm = normalizeForSearch(q);

  const fields = [site.name, site.slug, site.region, site.land_council, site.folder_name];

  for (const field of fields) {
    if (!field) continue;
    const text = String(field).toLowerCase();
    if (text.includes(qLower)) return true;
    if (normalizeForSearch(field).includes(qNorm)) return true;
  }

  return false;
}
