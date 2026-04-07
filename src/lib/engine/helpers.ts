export function toUsd(gtq: number, rate: number): number {
  return gtq / rate;
}

export function toGtq(usd: number, rate: number): number {
  return usd * rate;
}
