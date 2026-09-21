import type { Core } from 'cytoscape';
import type { Atlas } from './model';
export type NodePositions = Record<string, { x: number; y: number }>;
export type LocalLayouts = Record<string, NodePositions>;
export function parsePositions(value: unknown, atlas: Atlas): NodePositions {
  const result: NodePositions = Object.create(null);
  if (!value || typeof value !== 'object') return result;
  for (const c of atlas.characters) {
    const p = (value as NodePositions)[c.id];
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e8 && Math.abs(p.y) < 1e8) result[c.id] = { x: p.x, y: p.y };
  }
  return result;
}
export function graphPositions(cy: Core): NodePositions {
  return Object.fromEntries(cy.nodes().map(n => [n.data('rawId'), { ...n.position() }]));
}
