export function hsvToHex(h: number, s: number, v: number): string {
  const saturation = Math.max(0, Math.min(1, s)),
    value = Math.max(0, Math.min(1, v));
  const hue = (((h % 360) + 360) % 360) / 60,
    c = value * saturation,
    x = c * (1 - Math.abs((hue % 2) - 1)),
    m = value - c;
  const rgb =
    hue < 1
      ? [c, x, 0]
      : hue < 2
        ? [x, c, 0]
        : hue < 3
          ? [0, c, x]
          : hue < 4
            ? [0, x, c]
            : hue < 5
              ? [x, 0, c]
              : [c, 0, x];
  return (
    "#" +
    rgb
      .map((n) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function hexToHsv(hex: string) {
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)!
    .map((n) => parseInt(n, 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const h = !d
    ? 0
    : max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}
