import { describe, it, expect } from 'vitest'
import cytoscape from 'cytoscape'
import { applyGraphVisibility } from '../src/graph/selection'

describe('角色选择与关系高亮', () => {
  it('restores faction visibility synchronously before layout and fit', () => {
    const cy = cytoscape({ headless: true, styleEnabled: true, style: [{ selector: '.hidden', style: { display: 'none' } }], elements: [
      { data: { id: 'a', group: '山川' } }, { data: { id: 'b', group: '星海' } },
      { data: { id: 'ab', source: 'a', target: 'b' } },
    ] });
    try {
      expect(cy.nodes(':visible')).toHaveLength(2);
      applyGraphVisibility(cy, { group: '山川', selected: '', labels: true, neighborhood: false });
      expect(cy.nodes(':visible').map(n => n.id())).toEqual(['a']);
      expect(cy.edges(':visible')).toHaveLength(0);
      applyGraphVisibility(cy, { group: '', selected: '', labels: true, neighborhood: false });
      expect(cy.nodes(':visible')).toHaveLength(2);
      expect(cy.edges(':visible')).toHaveLength(1);
    } finally { cy.destroy(); }
  });
  it('标记全部入边、出边、多重关系与一度邻居，切换和取消时清理旧高亮', () => {
    const cy = cytoscape({ headless: true, elements: [
      ...['a', 'b', 'c', 'd'].map(id => ({ data: { id } })),
      ...[['ab', 'a', 'b'], ['ba', 'b', 'a'], ['ca', 'c', 'a'], ['bd', 'b', 'd'], ['aa', 'a', 'a']].map(([id, source, target]) => ({ data: { id, source, target } })),
    ] })
    try {
      const options = { group: '', selected: 'a', labels: true, neighborhood: false }
      applyGraphVisibility(cy, options)
      expect(cy.nodes('.chosen').map(n => n.id())).toEqual(['a'])
      expect(cy.nodes('.neighbor').map(n => n.id()).sort()).toEqual(['b', 'c'])
      expect(cy.edges('.connected').map(e => e.id()).sort()).toEqual(['aa', 'ab', 'ba', 'ca'])
      applyGraphVisibility(cy, { ...options, selected: 'd', neighborhood: true })
      expect(cy.nodes('.neighbor').map(n => n.id())).toEqual(['b'])
      expect(cy.getElementById('a').hasClass('dimmed')).toBe(true)
      applyGraphVisibility(cy, { ...options, selected: 'bd' })
      expect(cy.nodes('.neighbor').length).toBe(0)
      expect(cy.edges('.connected').length).toBe(0)
      applyGraphVisibility(cy, { ...options, selected: '' })
      expect(cy.elements('.chosen, .dimmed, .neighbor, .connected').length).toBe(0)
    } finally { cy.destroy() }
  })
})
