<script setup lang="ts">
import cytoscape, { type Core, type LayoutOptions } from "cytoscape";
import fcose from "cytoscape-fcose";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { separateBoxes } from "../layout";
import type { Atlas } from "../model";
import { relationLabel } from "../model";
cytoscape.use(fcose);
const props = defineProps<{
  data: Atlas;
  selected: string;
  group: string;
  labels: boolean;
  neighborhood: boolean;
  layout: string;
  theme: string;
}>();
const emit = defineEmits<{
  select: [kind: "character" | "relation" | "none", id: string];
  zoom: [value: number];
  ready: [];
  hover: [id: string];
  leave: [];
}>();
const container = ref<HTMLDivElement>();
const hoverNode = ref("");
let pinTimer: ReturnType<typeof setTimeout>;
function leavePin() {
  clearTimeout(pinTimer);
  emit("leave");
  pinTimer = setTimeout(() => {
    hoverNode.value = "";
  }, 400);
}
function pointerMove(event: PointerEvent) {
  if (!cy || !container.value || event.buttons) return;
  const rect = container.value.getBoundingClientRect(),
    x = event.clientX - rect.left,
    y = event.clientY - rect.top;
  const node = cy
    .nodes(":visible")
    .toArray()
    .find((n) => {
      const p = n.renderedPosition();
      return Math.hypot(x - p.x, y - p.y) <= n.renderedWidth() / 2 + 2;
    });
  if (node?.length) {
    clearTimeout(pinTimer);
    const id = node.data("rawId");
    if (hoverNode.value !== id) {
      hoverNode.value = id;
      emit("hover", id);
    }
  } else if (hoverNode.value) leavePin();
}
let cy: Core,
  observer: ResizeObserver,
  activeLayout: ReturnType<Core["layout"]> | undefined;
let priorIds = "";
function applyVisibility() {
  if (!cy) return;
  cy.batch(() => {
    cy.elements().removeClass("dimmed chosen hidden");
    if (props.group) {
      cy.nodes()
        .filter((n) => n.data("group") !== props.group)
        .addClass("hidden");
      cy.edges()
        .filter(
          (e) => e.source().hasClass("hidden") || e.target().hasClass("hidden"),
        )
        .addClass("hidden");
    }
    const selected = cy.getElementById(props.selected);
    if (selected.length) {
      selected.addClass("chosen");
      if (props.neighborhood)
        cy.elements()
          .difference(selected.closedNeighborhood())
          .addClass("dimmed");
    }
    cy.edges().toggleClass("no-label", !props.labels);
  });
}
function arrange() {
  if (!cy || !cy.nodes(":visible").length) return;
  activeLayout?.stop();
  const count = cy.nodes(":visible").length;
  activeLayout = cy
    .elements(":visible")
    .layout(
      props.layout === "circle"
        ? {
            name: "circle",
            animate: false,
            padding: 65,
            avoidOverlap: true,
            spacingFactor: 1.35,
            nodeDimensionsIncludeLabels: true,
          }
        : ({
            name: "fcose",
            quality: "default",
            randomize: true,
            animate: false,
            padding: 65,
            nodeDimensionsIncludeLabels: true,
            nodeRepulsion: 12000,
            idealEdgeLength: count > 80 ? 140 : 115,
            edgeElasticity: 0.35,
            nestingFactor: 0.1,
            gravity: 0.18,
            numIter: count > 200 ? 1500 : 2500,
            nodeSeparation: 70,
            packComponents: true,
            tile: true,
          } as LayoutOptions),
    );
  activeLayout.run();
  ensureSpacing();
  cy.fit(cy.elements(":visible"), 40);
  if (cy.zoom() > 1.25)
    cy.zoom({
      level: 1.25,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  emit("ready");
}
function ensureSpacing() {
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
  const separated = separateBoxes(boxes);
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
function sync() {
  if (!cy) return;
  const ids = JSON.stringify([
    props.data.characters.map((c) => c.id),
    props.data.relations.map((r) => [r.id, r.from, r.to]),
  ]);
  const positions = new Map(
    cy.nodes().map((n) => [n.id(), n.position()] as const),
  );
  cy.batch(() => {
    cy.elements().remove();
    cy.add(
      props.data.characters.map((c) => ({
        group: "nodes" as const,
        data: {
          id: `c:${c.id}`,
          label: c.name,
          color: c.color || "#4f8072",
          group: c.group,
          rawId: c.id,
        },
        position: positions.get(`c:${c.id}`),
      })),
    );
    cy.add(
      props.data.relations.map((r) => ({
        group: "edges" as const,
        data: {
          id: `r:${r.id}`,
          source: `c:${r.from}`,
          target: `c:${r.to}`,
          label: relationLabel(r),
          rawId: r.id,
        },
        classes: r.direction === "two-way" ? "two-way" : "",
      })),
    );
  });
  applyVisibility();
  if (priorIds !== ids) {
    priorIds = ids;
    arrange();
  } else ensureSpacing();
}
onMounted(() => {
  cy = cytoscape({
    container: container.value,
    minZoom: 0.08,
    maxZoom: 3,
    wheelSensitivity: 0.2,
    boxSelectionEnabled: false,
    autounselectify: true,
    style: [
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
          "curve-style": "bezier",
          "control-point-step-size": 42,
          "arrow-scale": 0.8,
          label: "data(label)",
          "font-family": "Microsoft YaHei, sans-serif",
          "font-size": 12,
          color: "#69766d",
          "text-background-color": "#fafbf8",
          "text-background-opacity": 1,
          "text-background-padding": "4px",
          "text-rotation": "autorotate",
          "text-margin-y": -1,
          "overlay-opacity": 0,
        },
      },
      { selector: "edge.two-way", style: { "source-arrow-shape": "triangle" } },
      {
        selector: "node.chosen",
        style: {
          "border-width": 3,
          "background-color": "#e5efea",
          "underlay-color": "#5b8b73",
          "underlay-opacity": 0.12,
          "underlay-padding": 10,
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
      { selector: ".dimmed", style: { opacity: 0.15 } },
      { selector: ".hidden", style: { display: "none" } },
      { selector: "edge.no-label", style: { label: "" } },
    ],
  });
  cy.on("tap", "node", (e) =>
    emit("select", "character", e.target.data("rawId")),
  );
  cy.on("tap", "edge", (e) =>
    emit("select", "relation", e.target.data("rawId")),
  );
  cy.on("tap", (e) => {
    if (e.target === cy) emit("select", "none", "");
  });
  cy.on("zoom", () => emit("zoom", Math.round(cy.zoom() * 100)));
  cy.on("dragfree", "node", ensureSpacing);
  cy.on("mouseover", "node, edge", () => {
    if (container.value) container.value.style.cursor = "pointer";
  });
  cy.on("mouseout", "node, edge", () => {
    if (container.value) container.value.style.cursor = "grab";
  });
  observer = new ResizeObserver(() => cy.resize());
  observer.observe(container.value!);
  sync();
  applyTheme();
});
function applyTheme() {
  if (!cy || !container.value) return;
  const css = getComputedStyle(container.value),
    get = (key: string) => css.getPropertyValue(key).trim();
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
      "background-color": get("--soft"),
      "underlay-color": get("--green"),
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
watch(
  () => props.theme,
  async () => {
    await nextTick();
    applyTheme();
  },
);
watch(() => props.data, sync, { deep: true });
watch(
  () => [props.selected, props.labels, props.neighborhood],
  applyVisibility,
);
watch(
  () => [props.group, props.layout],
  async () => {
    applyVisibility();
    await nextTick();
    arrange();
  },
);
function focus(id: string) {
  const node = cy?.getElementById(`c:${id}`);
  if (node?.length)
    cy.animate({
      center: { eles: node },
      zoom: Math.max(0.85, cy.zoom()),
      duration: 250,
    });
}
function zoomBy(factor: number) {
  cy?.zoom({
    level: cy.zoom() * factor,
    renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
  });
}
function fit() {
  cy?.fit(cy.elements(":visible"), 65);
}
async function exportImage(): Promise<Blob> {
  if (!cy || !props.data.characters.length)
    throw new Error("请先添加角色，再导出关系网图片。");
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-20000px;top:0;width:1600px;height:1200px;";
  document.body.append(host);
  let exported: Core | undefined;
  try {
    const css = getComputedStyle(container.value!),
      background = css.getPropertyValue("--paper").trim();
    const elements: cytoscape.ElementDefinition[] = cy
      .elements()
      .map((item) => ({
        data: item.data(),
        position: item.isNode() ? item.position() : undefined,
        group: item.group(),
        classes: item.hasClass("two-way") ? "two-way" : "",
      }));
    exported = cytoscape({
      container: host,
      elements,
      style: cy.json().style,
      layout: { name: "preset" },
      pixelRatio: 1,
    });
    exported.elements().removeClass("hidden dimmed chosen no-label");
    exported
      .layout({
        name: "fcose",
        animate: false,
        randomize: true,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 125,
        nodeRepulsion: 12000,
        numIter: 1500,
        tile: true,
      } as LayoutOptions)
      .run();
    const boxes = exported.nodes().map((n) => {
      const b = n.boundingBox({
        includeLabels: true,
        includeOverlays: false,
        includeUnderlays: false,
      });
      return {
        id: n.id(),
        x: (b.x1 + b.x2) / 2,
        y: (b.y1 + b.y2) / 2,
        width: b.w,
        height: b.h,
      };
    });
    separateBoxes(boxes).forEach((box, i) => {
      const n = exported!.getElementById(box.id),
        p = n.position();
      n.position({
        x: p.x + box.x - boxes[i]!.x,
        y: p.y + box.y - boxes[i]!.y,
      });
    });
    await document.fonts.ready;
    const bounds = exported.elements().boundingBox(),
      scale = Math.min(
        2,
        8000 / Math.max(bounds.w, bounds.h),
        Math.sqrt(32_000_000 / (bounds.w * bounds.h)),
      );
    return (await exported.png({
      output: "blob-promise",
      full: true,
      bg: background,
      scale,
    })) as Blob;
  } finally {
    exported?.destroy();
    host.remove();
  }
}
defineExpose({ arrange, focus, zoomBy, fit, exportImage });
onBeforeUnmount(() => {
  clearTimeout(pinTimer);
  activeLayout?.stop();
  observer?.disconnect();
  cy?.destroy();
});
</script>
<template>
  <div class="graph-canvas" @pointermove="pointerMove" @pointerleave="leavePin">
    <div
      ref="container"
      class="graph-engine"
      role="img"
      aria-label="可交互角色关系图，悬停角色查看关系，滚轮缩放，拖动平移"
    />
  </div>
</template>
