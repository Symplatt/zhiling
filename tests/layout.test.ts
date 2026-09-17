import { expect, it } from 'vitest'
import { separateBoxes, type NodeBox } from '../src/layout'
function verify(boxes: NodeBox[]) {
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i]!, b = boxes[j]!
    expect(Math.abs(a.x - b.x) >= (a.width + b.width) / 2 + 17.99 || Math.abs(a.y - b.y) >= (a.height + b.height) / 2 + 17.99).toBe(true)
  }
}
it('separates 500 coincident nodes, including large label bounds, with finite positions', () => {
  const boxes = Array.from({ length: 500 }, (_, i) => ({ id: String(i), x: 0, y: 0, width: i % 9 === 0 ? 150 : 76, height: i % 7 === 0 ? 130 : 76 }))
  const output = separateBoxes(boxes)
  expect(output.length).toBe(500)
  expect(output.every(b => Number.isFinite(b.x) && Number.isFinite(b.y))).toBe(true)
  verify(output)
})
it('preserves an already nonoverlapping layout', () => {
  const boxes = Array.from({ length: 50 }, (_, i) => ({ id: String(i), x: i * 150, y: 0, width: 76, height: 76 }))
  expect(separateBoxes(boxes)).toEqual(boxes)
})
