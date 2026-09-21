/** Normalize custom input to the #rrggbb format used by character nodes. */
export function parseRgbColor(input: string): string {
  let value = input.trim();
  if (/^#?[\da-f]{6}$/i.test(value))
    return `#${value.replace("#", "").toLowerCase()}`;
  if (/^rgb\s*\(/i.test(value)) {
    const match = value.match(/^rgb\s*\(([^()]*)\)$/i);
    if (!match) throw new Error("RGB 格式应为 rgb(107, 142, 115)。");
    value = match[1]!.trim();
  }
  const parts = value.replaceAll("，", ",").split(/\s*,\s*|\s+/);
  if (
    parts.length !== 3 ||
    parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)
  ) {
    throw new Error("请输入 #RRGGBB 或 rgb(红, 绿, 蓝)，每个数值为 0–255。");
  }
  return `#${parts.map((p) => Number(p).toString(16).padStart(2, "0")).join("")}`;
}

/** FIFO by addition: choosing an existing color does not change the queue. */
export function rememberCustomColor(
  history: readonly string[],
  color: string,
): string[] {
  const normalized = parseRgbColor(color);
  return history.includes(normalized)
    ? [...history]
    : [...history, normalized].slice(-7);
}

export function parseColorHistory(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.reduce<string[]>((history, color) => {
    if (typeof color !== "string") return history;
    try {
      return rememberCustomColor(history, color);
    } catch {
      return history;
    }
  }, []);
}
