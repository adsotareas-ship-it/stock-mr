// Identical units (same name, category and description) are the same "product".
export const productKey = (a) =>
  [a.name, a.category, a.sub].map(v => String(v ?? '').trim().toLowerCase()).join('|');

/** Map<productKey, { total, available }> over the whole catalog. */
export function productStats(assets) {
  const stats = new Map();
  for (const a of assets) {
    const key = productKey(a);
    const s = stats.get(key) ?? { total: 0, available: 0 };
    s.total += 1;
    if (a.status === 'Available') s.available += 1;
    stats.set(key, s);
  }
  return stats;
}
