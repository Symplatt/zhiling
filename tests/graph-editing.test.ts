import { expect, it } from 'vitest'
import cytoscape from 'cytoscape'
import { applyGraphSize } from '../src/graph/sizing'
import { placeNewNodes } from '../src/graph/incrementalLayout'
import { applyGraphVisibility } from '../src/graph/selection'
import { graphStyles } from '../src/graph/styles'

function graph() {
  return cytoscape({ headless: true, styleEnabled: true, style: graphStyles, layout: { name: 'preset' }, elements: [
    { data: { id: 'a', label: '安然', color: '#888888', groups: ['甲'] }, position: { x: -300, y: 100 } },
    { data: { id: 'b', label: '白露', color: '#888888', groups: ['乙'] }, position: { x: 100, y: -200 } },
    { data: { id: 'ab', source: 'a', target: 'b', label: '朋友', labelOffset: 0 } },
  ] })
}
it('scales readable relation labels, ordinary and highlighted strokes together at all five levels', () => {
  const cy = graph()
  try {
    for (let level = 1; level <= 5; level++) {
      applyGraphSize(cy, level)
      const scale = [0.6, 0.8, 1, 1.2, 1.4][level - 1]!, edge = cy.$id('ab')
      expect(parseFloat(edge.style('font-size'))).toBeCloseTo(15 * scale)
      expect(parseFloat(cy.$id('a').style('font-size'))).toBeCloseTo(15 * scale)
      expect(parseFloat(edge.style('width'))).toBeCloseTo(1.3 * scale)
      edge.addClass('connected')
      expect(parseFloat(edge.style('width'))).toBeCloseTo(2 * scale)
      edge.removeClass('connected').addClass('chosen')
      expect(parseFloat(edge.style('width'))).toBeCloseTo(2.5 * scale)
      edge.removeClass('chosen')
    }
  } finally { cy.destroy() }
})
it('preserves all manual coordinates while placing connected and isolated new nodes', () => {
  const cy = graph()
  try {
    const before = cy.nodes().map(n => ({ id: n.id(), position: { ...n.position() } }))
    cy.add([{ data: { id: 'c', label: '新增', color: '#888888' } }, { data: { id: 'd', label: '独立', color: '#888888' } },
      { data: { id: 'ac', source: 'a', target: 'c', label: '朋友', labelOffset: 0 } }])
    applyGraphSize(cy, 5)
    placeNewNodes(cy, new Set(['a', 'b']), 190)
    for (const n of before) expect(cy.$id(n.id).position()).toEqual(n.position)
    for (const id of ['c', 'd']) {
      const position = cy.$id(id).position()
      expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true)
      for (const other of cy.nodes().toArray().filter(n => n.id() !== id)) {
        expect(Math.hypot(position.x - other.position('x'), position.y - other.position('y'))).toBeGreaterThan(136)
      }
    }
  } finally { cy.destroy() }
})
it('filtering away and back leaves manual coordinates intact', () => {
  const cy = graph()
  try {
    const before = cy.nodes().map(n => ({ ...n.position() }))
    for (const group of ['甲', '乙', '']) applyGraphVisibility(cy, { group, selected: '', labels: true, neighborhood: false })
    expect(cy.nodes().map(n => ({ ...n.position() }))).toEqual(before)
  } finally { cy.destroy() }
})
