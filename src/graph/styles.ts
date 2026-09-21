import type { Core, StylesheetJson } from "cytoscape";
export const graphStyles: StylesheetJson = [
  {
    selector: "node",
    style: {
      width: 76,
      height: 76,
      "background-color": "#ffffff",
      "border-color": "data(color)",
      "border-width": 2,
      label: "data(label)",
      color: "#33443d",
      "font-family": "Microsoft YaHei, sans-serif",
      "font-size": 15,
      "text-valign": "center",
      "text-halign": "center",
      "text-wrap": "wrap",
      "text-overflow-wrap": "anywhere",
      "text-max-width": "66px",
      "overlay-opacity": 0,
      "transition-property": "opacity",
      "transition-duration": 160,
    },
  },
  {
    selector: "edge",
    style: {
      width: 1.3,
      "line-color": "#b6c4bc",
      "target-arrow-color": "#93a79b",
      "source-arrow-color": "#93a79b",
      "target-arrow-shape": "triangle",
      "curve-style": "straight",
      "arrow-scale": 0.8,
      label: "data(label)",
      "font-family": "Microsoft YaHei, sans-serif",
      "font-size": 15,
      color: "#69766d",
      "text-background-color": "#fafbf8",
      "text-background-opacity": 1,
      "text-background-padding": "4px",
      "text-rotation": "autorotate",
      "text-margin-y": "data(labelOffset)" as unknown as number,
      "overlay-opacity": 0,
    },
  },
  { selector: "edge.two-way", style: { "source-arrow-shape": "triangle" } },
  { selector: "edge[parallelCount > 1]", style: { "text-rotation": "none" } },
  {
    selector: "edge.self-relation",
    style: {
      "line-opacity": 0,
      "source-arrow-shape": "none",
      "target-arrow-shape": "none",
      "text-events": "yes",
    },
  },
  {
    selector: "node.chosen",
    style: {
      "border-width": 2.8,
      "outline-width": 1.2,
      "outline-offset": 5,
      "outline-opacity": 0.5,
      "font-weight": 600,
      "background-color": "#e5efea",
      "underlay-color": "#5b8b73",
      "underlay-opacity": 0.05,
      "underlay-padding": 9,
      "underlay-shape": "ellipse",
    },
  },
  {
    selector: "edge.chosen",
    style: {
      width: 2.5,
      "line-color": "#54846f",
      "target-arrow-color": "#54846f",
      "source-arrow-color": "#54846f",
      color: "#315e48",
    },
  },
  {
    selector: "node.neighbor",
    style: {
      "border-width": 2.2,
    },
  },
  {
    selector: "edge.connected",
    style: { width: 2, opacity: 1, "arrow-scale": 0.9 },
  },
  { selector: ".dimmed", style: { opacity: 0.15 } },
  { selector: ".hidden", style: { display: "none" } },
  { selector: "edge.no-label", style: { label: "" } },
];
export function applyGraphTheme(cy: Core, container: HTMLElement) {
  const css = getComputedStyle(container),
    get = (key: string) => css.getPropertyValue(key).trim();
  const accent = get("--green"),
    background = get("--node-bg");
  // Mix small amounts of the theme accent into the surface, avoiding solid halos.
  const tint = (base: string, amount: number) => {
    const rgb = (hex: string) =>
      hex
        .replace("#", "")
        .match(/../g)!
        .map((c) => parseInt(c, 16));
    const a = rgb(base),
      b = rgb(accent);
    return `rgb(${a.map((c, i) => Math.round(c * (1 - amount) + b[i]! * amount)).join(",")})`;
  };
  cy.style()
    .selector("node")
    .style({ "background-color": get("--node-bg"), color: get("--text") })
    .selector("edge")
    .style({
      "line-color": get("--edge"),
      "target-arrow-color": get("--edge"),
      "source-arrow-color": get("--edge"),
      color: get("--muted"),
      "text-background-color": get("--paper"),
    })
    .selector("node.chosen")
    .style({
      "background-color": tint(background, 0.14),
      "border-color": "data(color)",
      "outline-color": accent,
      "underlay-color": accent,
    })
    .selector("node.neighbor")
    .style({
      "border-color": "data(color)",
      "background-color": tint(background, 0.05),
    })
    .selector("edge.connected")
    .style({
      "line-color": tint(get("--edge"), 0.65),
      "target-arrow-color": tint(get("--edge"), 0.65),
      "source-arrow-color": tint(get("--edge"), 0.65),
      color: get("--text"),
    })
    .selector("edge.chosen")
    .style({
      "line-color": get("--green"),
      color: get("--green"),
      "target-arrow-color": get("--green"),
      "source-arrow-color": get("--green"),
    })
    .update();
}
