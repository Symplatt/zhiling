import { expect, it } from 'vitest'
import cytoscape from 'cytoscape'
import { graphLayoutOptions, ensureGraphSpacing } from '../src/graph/layout'

it('places 3 to 100 nodes at equal radii and angular intervals in a circle', () => {
  for (const count of [3, 4, 5, 9, 25, 100]) {
    const cy = cytoscape({ headless: true, elements: Array.from({ length: count }, (_, i) => ({ data: { id: String(i) } })) })
    try {
      cy.layout(graphLayoutOptions('circle', count, 100)).run()
      const points = cy.nodes().map(n => n.position())
      const cx = points.reduce((sum, p) => sum + p.x / count, 0), cyCentre = points.reduce((sum, p) => sum + p.y / count, 0)
      const radii = points.map(p => Math.hypot(p.x - cx, p.y - cyCentre))
      const sides = points.map((p, i) => Math.hypot(p.x - points[(i + 1) % count]!.x, p.y - points[(i + 1) % count]!.y))
      expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(1e-6)
      expect(Math.max(...sides) - Math.min(...sides)).toBeLessThan(1e-6)
    } finally { cy.destroy() }
  }
})

it('keeps an eight-character ring compact at maximum avatar size, independent of viewport size', () => {
  const distances: number[] = []
  for (const width of [800, 2400]) {
    const cy = cytoscape({ headless: true, styleEnabled: true,
      style: [{ selector: 'node', style: { width: 106.4, height: 106.4 } }],
      elements: Array.from({ length: 8 }, (_, i) => ({ data: { id: String(i) } })),
    })
    try {
      cy.layout({ ...(graphLayoutOptions('circle', 8, 150) as cytoscape.CircleLayoutOptions), boundingBox: { x1: 0, y1: 0, w: width, h: width } }).run()
      ensureGraphSpacing(cy)
      const bounds = cy.nodes().boundingBox(), first = cy.$id('0').position(), next = cy.$id('1').position()
      distances.push(Math.hypot(first.x - next.x, first.y - next.y))
      expect(106.4 / Math.max(bounds.w, bounds.h)).toBeGreaterThan(.17)
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
        const a = cy.$id(String(i)).position(), b = cy.$id(String(j)).position()
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(106.4)
      }
    } finally { cy.destroy() }
  }
  expect(distances[0]).toBeCloseTo(distances[1]!, 6)
})
