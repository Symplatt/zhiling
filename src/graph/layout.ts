import type { Core, LayoutOptions } from "cytoscape";
import { separateBoxes } from "../layout";

/** Expand around the visible graph centre without altering node sizes or hidden nodes. */
export function scaleGraphSpacing(cy: Core, factor: number) {
  const nodes = cy.nodes(":visible");
  if (!nodes.length || factor === 1) return;
  const centre = nodes.reduce((sum, node) => ({
    x: sum.x + node.position("x") / nodes.length,
    y: sum.y + node.position("y") / nodes.length,
  }), { x: 0, y: 0 });
  cy.batch(() => nodes.forEach(node => {
    const point = node.position();
    node.position({
      x: centre.x + (point.x - centre.x) * factor,
      y: centre.y + (point.y - centre.y) * factor,
    });
  }));
}
export function graphLayoutOptions(mode: string, count: number, nodeExtent = 76): LayoutOptions {
  return mode === "circle"
    ? {
        name: "circle",
        animate: false,
        fit: false,
        padding: 65,
        // Cytoscape's default radius grows with the viewport and its overlap
        // guard adds another 1.75x gap. Use measured nodes, then separate labels.
        radius: count < 2 ? 0 : (nodeExtent + 28) / (2 * Math.sin(Math.PI / count)),
        avoidOverlap: false,
        spacingFactor: 1,
        nodeDimensionsIncludeLabels: true,
      }
    : ({
        name: "fcose",
        quality: "default",
        randomize: true,
        animate: false,
        fit: false,
        padding: 65,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: 4500,
        idealEdgeLength: 65,
        edgeElasticity: 0.35,
        nestingFactor: 0.1,
        gravity: 0.12,
        numIter: count > 200 ? 1500 : 2500,
        nodeSeparation: 32,
        packComponents: true,
        tile: true,
        tilingPaddingVertical: 32,
        tilingPaddingHorizontal: 32,
      } as LayoutOptions);
}
export function ensureGraphSpacing(cy: Core) {
  const boxes = cy.nodes(":visible").map((node) => {
    const b = node.boundingBox({
      includeLabels: true,
      includeOverlays: false,
      includeUnderlays: false,
    });
    return {
      id: node.id(),
      x: (b.x1 + b.x2) / 2,
      y: (b.y1 + b.y2) / 2,
      width: b.w,
      height: b.h,
    };
  });
  const separated = separateBoxes(boxes, 32);
  cy.batch(() =>
    separated.forEach((box, i) => {
      const node = cy.getElementById(box.id),
        position = node.position(),
        prior = boxes[i]!;
      node.position({
        x: position.x + box.x - prior.x,
        y: position.y + box.y - prior.y,
      });
    }),
  );
}
