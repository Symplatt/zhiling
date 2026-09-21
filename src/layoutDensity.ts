export const densityLevels = [1, 2, 3, 4, 5] as const;
export type LayoutDensity = (typeof densityLevels)[number];

export function parseLayoutDensity(value: unknown): LayoutDensity {
  return densityLevels.includes(value as LayoutDensity) ? value as LayoutDensity : 1;
}

export function densityScale(value: unknown): number {
  return 1 + (parseLayoutDensity(value) - 1) * 0.2;
}
