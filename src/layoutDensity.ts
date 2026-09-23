export const densityLevels = [1, 2, 3, 4, 5] as const;
export type LayoutDensity = (typeof densityLevels)[number];

export function parseLayoutDensity(value: unknown): LayoutDensity {
  return densityLevels.includes(value as LayoutDensity) ? value as LayoutDensity : 3;
}

export function densityScale(value: unknown): number {
  // Level 3 matches the former level 5; each step is 20% of this baseline.
  return 1.8 * (1 + (parseLayoutDensity(value) - 3) * 0.2);
}

/** Avatar size has its own baseline: level 3 is the former 76px level 1. */
export function nodeSizeScale(value: unknown): number {
  return 1 + (parseLayoutDensity(value) - 3) * 0.2;
}
