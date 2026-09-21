import type { Core, EdgeSingular } from "cytoscape";
import { separateBoxes, type NodeBox } from "../layout";
export interface StraightLink {
  from: string;
  to: string;
}

/** Move obstructing nodes, keeping every relationship segment straight.
 * Bounded refinement is used because dense, non-planar graphs may still cross.
 */
export function clearStraightSegments(
  input: NodeBox[],
  links: StraightLink[],
): NodeBox[] {
  let boxes = input.map((b) => ({ ...b }));
  const score = (candidate: NodeBox, original: NodeBox) =>
    boxes.reduce(
      (total, other) => {
        if (other.id === candidate.id) return total;
        const x =
          (candidate.width + other.width) / 2 +
          24 -
          Math.abs(candidate.x - other.x);
        const y =
          (candidate.height + other.height) / 2 +
          24 -
          Math.abs(candidate.y - other.y);
        return total + (x > 0 && y > 0 ? 10000 + x * y : 0);
      },
      Math.hypot(candidate.x - original.x, candidate.y - original.y),
    );
  for (let pass = 0; pass < 16; pass++) {
    let moved = false;
    const byId = new Map(boxes.map((b) => [b.id, b]));
    for (const link of links) {
      const a = byId.get(link.from),
        b = byId.get(link.to);
      if (!a || !b || a === b) continue;
      const dx = b.x - a.x,
        dy = b.y - a.y,
        length = Math.hypot(dx, dy);
      if (length < 1) continue;
      for (const node of boxes) {
        if (node === a || node === b) continue;
        const t =
          ((node.x - a.x) * dx + (node.y - a.y) * dy) / (length * length);
        if (t <= 0 || t >= 1) continue;
        const distance = ((node.y - a.y) * dx - (node.x - a.x) * dy) / length;
        const clearance = Math.max(node.width, node.height) / 2 + 18;
        if (Math.abs(distance) >= clearance) continue;
        const alternatives = [-1, 1].map((sign) => {
          const delta = sign * (clearance + 4) - distance;
          return {
            ...node,
            x: node.x - (dy / length) * delta,
            y: node.y + (dx / length) * delta,
          };
        });
        alternatives.sort(
          (left, right) => score(left, node) - score(right, node),
        );
        Object.assign(node, alternatives[0]);
        moved = true;
      }
    }
    if (!moved) break;
    boxes = separateBoxes(boxes, 24);
  }
  return boxes;
}

export function improveStraightLayout(cy: Core) {
  const nodes = cy.nodes(":visible"),
    boxes = nodes.map((n) => ({
      id: n.id(),
      ...n.position(),
      width: n.outerWidth(),
      height: n.outerHeight(),
    }));
  const links = cy
    .edges(":visible")
    .toArray()
    .filter(e => (e.data('parallelCount') || 1) === 1)
    .map((e) => ({ from: e.source().id(), to: e.target().id() }));
  const positions = clearStraightSegments(boxes, links);
  cy.batch(() =>
    positions.forEach((p) => cy.$id(p.id).position({ x: p.x, y: p.y })),
  );
}

export function separateRelationshipLabels(cy: Core) {
  const pairs = new Map<string, EdgeSingular[]>();
  cy.edges().forEach((edge) => {
    const key = JSON.stringify([edge.source().id(), edge.target().id()].sort());
    pairs.set(key, [...(pairs.get(key) || []), edge]);
  });
  cy.batch(() =>
    pairs.forEach((edges) =>
      edges.forEach((edge) => {
        edge.data("labelOffset", 0);
        edge.data("parallelCount", edges.length);
      }),
    ),
  );
}
