import { expect, it } from "vitest";
import cytoscape from "cytoscape";
import {
  clearStraightSegments,
  separateRelationshipLabels,
} from "../src/graph/straightLayout";
import { snapshotGraph } from "../src/graph/exportImage";
import { graphStyles } from "../src/graph/styles";
it("moves an unrelated node off a straight segment without mutating input", () => {
  const nodes = [
    { id: "a", x: 0, y: 0, width: 76, height: 76 },
    { id: "b", x: 600, y: 0, width: 76, height: 76 },
    { id: "c", x: 300, y: 0, width: 76, height: 76 },
  ];
  const result = clearStraightSegments(nodes, [{ from: "a", to: "b" }]);
  expect(Math.abs(result[2]!.y)).toBeGreaterThan(56);
  expect(nodes[2]!.y).toBe(0);
  expect(result[0]).toEqual(nodes[0]);
  expect(result[1]).toEqual(nodes[1]);
});
it("keeps straight parallel relations with separate labels and isolates export coordinates", () => {
  const cy = cytoscape({
    headless: true,
    styleEnabled: true,
    style: graphStyles,
    layout: { name: "preset" },
    elements: [
      {
        data: { id: "a", color: "#4f8072", label: "阿青" },
        position: { x: 0, y: 0 },
      },
      {
        data: { id: "b", color: "#4f8072", label: "白露" },
        position: { x: 600, y: 0 },
      },
      {
        data: {
          id: "ab",
          source: "a",
          target: "b",
          label: "朋友",
          labelOffset: 0,
        },
      },
      {
        data: {
          id: "ba",
          source: "b",
          target: "a",
          label: "同门",
          labelOffset: 0,
        },
        classes: "two-way",
      },
    ],
  });
  try {
    separateRelationshipLabels(cy);
    expect(cy.edges().map((e) => e.style("curve-style"))).toEqual([
      "straight",
      "straight",
    ]);
    expect(cy.$id("ab").data("labelOffset")).not.toBe(
      cy.$id("ba").data("labelOffset"),
    );
    cy.$id("b").position({ x: 0, y: 600 });
    expect(cy.edges().every((edge) => edge.style("text-rotation") === "none")).toBe(true);
    const before = cy.nodes().map((n) => ({ ...n.position() }));
    cy.$id("a").addClass("chosen hidden");
    const copy = cytoscape({
      headless: true,
      ...snapshotGraph(cy),
      layout: { name: "preset" },
    });
    try {
      expect(copy.nodes().map((n) => n.position())).toEqual(before);
      copy.$id("a").position({ x: 900, y: 600 });
      copy.$id("ab").data("labelOffset", 999);
      expect(cy.nodes().map((n) => n.position())).toEqual(before);
      expect(cy.$id("ab").data("labelOffset")).not.toBe(999);
      expect(copy.$id("a").hasClass("hidden")).toBe(false);
    } finally {
      copy.destroy();
    }
  } finally {
    cy.destroy();
  }
});
