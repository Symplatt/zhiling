import type { Core, NodeSingular } from 'cytoscape'

/** Place only new nodes. Existing manual coordinates are an invariant. */
export function placeNewNodes(cy: Core, existingIds: Set<string>, spacing: number) {
  const occupied = cy.nodes().filter(n => existingIds.has(n.id())).toArray() as NodeSingular[]
  for (const node of cy.nodes().filter(n => !existingIds.has(n.id())).toArray() as NodeSingular[]) {
    const neighbors = node.neighborhood().nodes().filter(n => occupied.includes(n))
    const anchors = neighbors.length ? neighbors.toArray() as NodeSingular[] : occupied
    const center = anchors.length ? {
      x: anchors.reduce((sum, n) => sum + n.position('x'), 0) / anchors.length,
      y: anchors.reduce((sum, n) => sum + n.position('y'), 0) / anchors.length,
    } : { x: 0, y: 0 }
    // Search concentric rings; the search is bounded by the number of occupied nodes.
    for (let attempt = 0; attempt < (occupied.length + 1) * 100; attempt++) {
      const ring = Math.floor(attempt / 24) + 1
      const angle = (attempt % 24) * Math.PI / 12
      node.position({ x: center.x + Math.cos(angle) * spacing * ring,
        y: center.y + Math.sin(angle) * spacing * ring })
      const box = node.boundingBox({ includeLabels: true })
      const overlaps = occupied.some(other => {
        const b = other.boundingBox({ includeLabels: true })
        return box.x1 < b.x2 + 32 && box.x2 + 32 > b.x1 && box.y1 < b.y2 + 32 && box.y2 + 32 > b.y1
      })
      if (!overlaps) break
    }
    occupied.push(node)
  }
}
