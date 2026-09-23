import { expect, it } from 'vitest'
import cytoscape from 'cytoscape'
import { applyAvatarNames, applyGraphSize } from '../src/graph/sizing'
import { snapshotGraph } from '../src/graph/exportImage'
import { graphStyles } from '../src/graph/styles'
import { createLibrary, parseLibrary } from '../src/library'
import { createSample } from '../src/sample'

it('hides only avatar names and preserves the choice in export snapshots and size changes', () => {
  const cy = cytoscape({ headless: true, styleEnabled: true, style: graphStyles, elements: [
    { data: { id: 'a', label: '有头像', color: '#888', avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6k1sAAAAASUVORK5CYII=' }, classes: 'has-avatar' },
    { data: { id: 'b', label: '无头像', color: '#888' } },
  ] })
  try {
    applyAvatarNames(cy, false)
    applyGraphSize(cy, 5)
    expect(cy.$id('a').style('label')).toBe('')
    expect(cy.$id('b').style('label')).toBe('无头像')
    const copy = cytoscape({ headless: true, styleEnabled: true, ...snapshotGraph(cy) })
    try { expect(copy.$id('a').style('label')).toBe('') } finally { copy.destroy() }
    applyAvatarNames(cy, true)
    expect(cy.$id('a').style('label')).toBe('有头像')
  } finally { cy.destroy() }
})

it('defaults old libraries to visible avatar names and restores an explicit hidden preference', () => {
  const library = createLibrary(createSample())
  expect(parseLibrary(library).showAvatarNames).toBe(true)
  expect(parseLibrary({ ...library, showAvatarNames: false }).showAvatarNames).toBe(false)
})
