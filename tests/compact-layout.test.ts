import { expect, it } from 'vitest'
import cytoscape from 'cytoscape'
import { graphLayoutOptions, ensureGraphSpacing } from '../src/graph/layout'

it('keeps an eight-character ring compact at maximum avatar size, independent of viewport size', () => {
  const distances: number[] = []
  for (const width of [800, 2400]) {
    const cy = cytoscape({ headless: true, styleEnabled: true,
      style: [{ selector: 'node', style: { width: 136.8, height: 136.8 } }],
      elements: Array.from({ length: 8 }, (_, i) => ({ data: { id: String(i) } })),
    })
    try {
      cy.layout({ ...(graphLayoutOptions('circle', 8, 190) as cytoscape.CircleLayoutOptions), boundingBox: { x1: 0, y1: 0, w: width, h: width } }).run()
      ensureGraphSpacing(cy)
      const bounds = cy.nodes().boundingBox(), first = cy.$id('0').position(), next = cy.$id('1').position()
      distances.push(Math.hypot(first.x - next.x, first.y - next.y))
      expect(136.8 / Math.max(bounds.w, bounds.h)).toBeGreaterThan(.17)
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
        const a = cy.$id(String(i)).position(), b = cy.$id(String(j)).position()
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(136.8)
      }
    } finally { cy.destroy() }
  }
  expect(distances[0]).toBeCloseTo(distances[1]!, 6)
})
