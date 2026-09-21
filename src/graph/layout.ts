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
export function graphLayoutOptions(mode: string, count: number): LayoutOptions {
  return mode === "circle"
    ? {
        name: "circle",
        animate: false,
        padding: 65,
        avoidOverlap: true,
        spacingFactor: 1.7,
        nodeDimensionsIncludeLabels: true,
      }
    : ({
        name: "fcose",
        quality: "default",
        randomize: true,
        animate: false,
        padding: 65,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: 20000,
        idealEdgeLength: count > 80 ? 220 : 190,
        edgeElasticity: 0.35,
        nestingFactor: 0.1,
        gravity: 0.12,
        numIter: count > 200 ? 1500 : 2500,
        nodeSeparation: 110,
        packComponents: true,
        tile: true,
        tilingPaddingVertical: 70,
        tilingPaddingHorizontal: 70,
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
