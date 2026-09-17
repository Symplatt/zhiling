export interface NodeBox { id: string; x: number; y: number; width: number; height: number }
/** Keep the force layout's shape; move only colliding label-inclusive rectangles.
 * A spatial hash limits comparisons. A free right-hand column is a finite fallback.
 */
export function separateBoxes(boxes: NodeBox[], gap = 18): NodeBox[] {
  const cellSize = 160, grid = new Map<string, NodeBox[]>(), placed: NodeBox[] = []
  let rightmost = -Infinity
  const cells = (b: NodeBox) => {
    const keys: string[] = []
    for (let x = Math.floor((b.x - b.width / 2 - gap) / cellSize); x <= Math.floor((b.x + b.width / 2 + gap) / cellSize); x++)
      for (let y = Math.floor((b.y - b.height / 2 - gap) / cellSize); y <= Math.floor((b.y + b.height / 2 + gap) / cellSize); y++) keys.push(`${x}:${y}`)
    return keys
  }
  const collides = (b: NodeBox) => cells(b).some(key => grid.get(key)?.some(other => Math.abs(b.x - other.x) < (b.width + other.width) / 2 + gap && Math.abs(b.y - other.y) < (b.height + other.height) / 2 + gap))
  for (const original of boxes) {
    const box = { ...original, x: Number.isFinite(original.x) ? original.x : 0, y: Number.isFinite(original.y) ? original.y : 0 }
    const origin = { x: box.x, y: box.y }
    for (let attempt = 1; collides(box); attempt++) {
      if (attempt > 600) { box.x = rightmost + box.width / 2 + gap + 1; break }
      const angle = attempt * 2.399963229728653, distance = 14 * Math.sqrt(attempt)
      box.x = origin.x + Math.cos(angle) * distance
      box.y = origin.y + Math.sin(angle) * distance
    }
    for (const key of cells(box)) { if (!grid.has(key)) grid.set(key, []); grid.get(key)!.push(box) }
    rightmost = Math.max(rightmost, box.x + box.width / 2)
    placed.push(box)
  }
  return placed
}
