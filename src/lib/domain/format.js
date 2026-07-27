export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('en-AU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatAreaM2(value) {
  return `${formatNumber(value, 1)} m²`;
}

export function formatAreaHa(value) {
  return `${formatNumber(value, 4)} ha`;
}

export function formatKw(value) {
  if (value == null) return '—';
  return `${formatNumber(value, 0)} kW`;
}

export function formatKwh(value) {
  if (value == null) return '—';
  return `${formatNumber(value, 0)} kWh`;
}
