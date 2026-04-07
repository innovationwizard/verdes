const usdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatUSD(value: number): string {
  return `$${usdFormatter.format(value)}`;
}

export function formatGTQ(value: number): string {
  return `Q ${usdFormatter.format(value)}`;
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
