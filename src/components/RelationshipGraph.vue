<script setup lang="ts">
import cytoscape, { type Core } from "cytoscape";
import fcose from "cytoscape-fcose";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { graphLayoutOptions, ensureGraphSpacing, scaleGraphSpacing } from "../graph/layout";
import { densityScale } from "../layoutDensity";
import { graphPositions, type NodePositions } from "../localLayout";
import { graphStyles, applyGraphTheme } from "../graph/styles";
import { applyGraphVisibility } from "../graph/selection";
import { exportGraphImage } from "../graph/exportImage";
import {
  improveStraightLayout,
  separateRelationshipLabels,
} from "../graph/straightLayout";
import type { Atlas } from "../model";
import { relationLabel } from "../model";
import { characterGroups } from "../characters";
cytoscape.use(fcose);
const props = defineProps<{
  data: Atlas;
  storyId: string;
  selected: string;
  group: string;
  labels: boolean;
  neighborhood: boolean;
  layout: string;
  density: number;
  nodeSize: number;
  positions: NodePositions;
  theme: string;
}>();
const emit = defineEmits<{
  select: [kind: "character" | "relation" | "none", id: string];
  zoom: [value: number];
  ready: [];
  hover: [id: string];
  leave: [];
  positions: [positions: NodePositions];
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
function positions() { return cy ? graphPositions(cy) : {}; }
function recordPositions() { emit('positions', positions()); }
function applyNodeSize() {
  const scale = densityScale(props.nodeSize);
  cy.style().selector('node').style({ width: 76 * scale, height: 76 * scale, 'font-size': 15 * Math.sqrt(scale), 'text-max-width': `${66 * scale}px` })
    .selector('node.has-avatar').style({ 'text-max-width': '160px' }).update();
}
function applyVisibility() {
  applyGraphVisibility(cy, props);
}

function arrange() {
  if (!cy || !cy.nodes(":visible").length) return;
  activeLayout?.stop();
  // A sidebar click may still be animating focus when the faction changes.
  cy.stop(true, false);
  cy.nodes().stop(true, false);
  cy.resize();
  const count = cy.nodes(":visible").length;
  activeLayout = cy
    .elements(":visible")
    .layout(graphLayoutOptions(props.layout, count));
  activeLayout.run();
  ensureSpacing();
  improveStraightLayout(cy);
  scaleGraphSpacing(cy, densityScale(props.density));
  fitArrangement();
  recordPositions();
  emit("ready");
}
function fitArrangement() {
  cy.fit(cy.elements(":visible"), 40);
  if (cy.zoom() > 1.25)
    cy.zoom({
      level: 1.25,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
}
function ensureSpacing() {
  ensureGraphSpacing(cy);
}

function sync() {
  if (!cy) return;
  const firstLoad = priorIds === '';
  const ids = JSON.stringify([
    props.data.characters.map((c) => c.id),
    props.data.relations.map((r) => [r.id, r.from, r.to]),
  ]);
  const positions = new Map(
    cy.nodes().map((n) => [n.id(), { ...n.position() }] as const),
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
          groups: characterGroups(c),
          avatar: c.avatar || '',
          rawId: c.id,
        },
        // Cytoscape mutates the supplied object while dragging. Keep the saved
        // snapshot independent so movement is detected and queued for saving.
        position: positions.get(`c:${c.id}`) || (props.positions[c.id] ? { ...props.positions[c.id]! } : undefined),
        classes: c.avatar ? 'has-avatar' : '',
      })),
    );
    cy.add(
      props.data.relations.map((r) => ({
        group: "edges" as const,
        data: {
          id: `r:${r.id}`,
          source: `c:${r.from}`,
          target: `c:${r.to}`,
          label:
            r.from === r.to ? `${relationLabel(r)}（自身）` : relationLabel(r),
          labelOffset: 0,
          rawId: r.id,
        },
        classes: [
          r.direction === "two-way" ? "two-way" : "",
          r.from === r.to ? "self-relation" : "",
        ].join(" "),
      })),
    );
  });
  applyVisibility();
  separateRelationshipLabels(cy);
  applyNodeSize();
  if (firstLoad && props.data.characters.length && props.data.characters.every(c => props.positions[c.id])) {
    priorIds = ids;
    fitArrangement();
  } else if (priorIds !== ids) {
    priorIds = ids;
    arrange();
  } else {
    ensureSpacing();
    recordPositions();
  }
}
onMounted(() => {
  cy = cytoscape({
    container: container.value,
    minZoom: 0.08,
    maxZoom: 3,
    // Cytoscape normalizes notched wheels to tiny deltas; keep each notch visible.
    wheelSensitivity: 6,
    boxSelectionEnabled: false,
    autounselectify: true,
    style: graphStyles,
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
  cy.on("dragfree", "node", () => {
    ensureSpacing();
    recordPositions();
  });
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
  if (cy && container.value) applyGraphTheme(cy, container.value);
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
    cy.stop(true, false);
    applyVisibility();
    await nextTick();
    arrange();
  },
);
watch(() => props.density, (value, previous) => {
  if (!cy) return;
  cy.stop(true, false);
  cy.nodes().stop(true, false);
  scaleGraphSpacing(cy, densityScale(value) / densityScale(previous));
  fitArrangement();
  recordPositions();
});
watch(() => props.nodeSize, () => {
  if (!cy) return;
  applyNodeSize();
  ensureSpacing();
  fitArrangement();
  recordPositions();
});
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
function exportImage() {
  return exportGraphImage(cy, container.value!);
}

defineExpose({ arrange, focus, zoomBy, fit, exportImage, positions, storyId: () => props.storyId });
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
