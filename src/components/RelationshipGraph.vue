<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import cytoscape, { type Core, type LayoutOptions } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import type { Atlas } from '../model'
import { separateBoxes } from '../layout'
cytoscape.use(fcose)
const props = defineProps<{ data: Atlas; selected: string; group: string; labels: boolean; neighborhood: boolean; layout: string }>()
const emit = defineEmits<{ select: [kind: 'character' | 'relation' | 'none', id: string]; zoom: [value: number]; ready: [] }>()
const container = ref<HTMLDivElement>()
let cy: Core, observer: ResizeObserver, activeLayout: ReturnType<Core['layout']> | undefined
let priorIds = ''
function applyVisibility() {
  if (!cy) return
  cy.batch(() => {
    cy.elements().removeClass('dimmed chosen hidden')
    if (props.group) {
      cy.nodes().filter(n => n.data('group') !== props.group).addClass('hidden')
      cy.edges().filter(e => e.source().hasClass('hidden') || e.target().hasClass('hidden')).addClass('hidden')
    }
    const selected = cy.getElementById(props.selected)
    if (selected.length) {
      selected.addClass('chosen')
      if (props.neighborhood) cy.elements().difference(selected.closedNeighborhood()).addClass('dimmed')
    }
    cy.edges().toggleClass('no-label', !props.labels)
  })
}
function arrange() {
  if (!cy || !cy.nodes(':visible').length) return
  activeLayout?.stop()
  const count = cy.nodes(':visible').length
  activeLayout = cy.elements(':visible').layout(props.layout === 'circle'
    ? { name: 'circle', animate: false, padding: 65, avoidOverlap: true, spacingFactor: 1.35, nodeDimensionsIncludeLabels: true }
    : { name: 'fcose', quality: 'default', randomize: true, animate: false, padding: 65, nodeDimensionsIncludeLabels: true, nodeRepulsion: 12000, idealEdgeLength: count > 80 ? 140 : 115, edgeElasticity: 0.35, nestingFactor: 0.1, gravity: 0.18, numIter: count > 200 ? 1500 : 2500, nodeSeparation: 70, packComponents: true, tile: true } as LayoutOptions)
  activeLayout.run()
  ensureSpacing()
  cy.fit(cy.elements(':visible'), 40)
  if (cy.zoom() > 1.25) cy.zoom({ level: 1.25, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
  emit('ready')
}
function ensureSpacing() {
  const boxes = cy.nodes(':visible').map(node => {
    const b = node.boundingBox({ includeLabels: true, includeOverlays: false, includeUnderlays: false })
    return { id: node.id(), x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2, width: b.w, height: b.h }
  })
  const separated = separateBoxes(boxes)
  cy.batch(() => separated.forEach((box, i) => {
    const node = cy.getElementById(box.id), position = node.position(), prior = boxes[i]!
    node.position({ x: position.x + box.x - prior.x, y: position.y + box.y - prior.y })
  }))
}
function sync() {
  if (!cy) return
  const ids = JSON.stringify([props.data.characters.map(c => c.id), props.data.relations.map(r => [r.id, r.from, r.to])])
  const positions = new Map(cy.nodes().map(n => [n.id(), n.position()] as const))
  cy.batch(() => {
    cy.elements().remove()
    cy.add(props.data.characters.map(c => ({ group: 'nodes' as const, data: { id: `c:${c.id}`, label: c.name, avatar: c.avatar || '', color: c.color || '#4f8072', group: c.group, rawId: c.id }, position: positions.get(`c:${c.id}`), classes: c.avatar ? 'avatar' : '' })))
    cy.add(props.data.relations.map(r => ({ group: 'edges' as const, data: { id: `r:${r.id}`, source: `c:${r.from}`, target: `c:${r.to}`, label: r.label, rawId: r.id }, classes: r.direction === 'two-way' ? 'two-way' : '' })))
  })
  applyVisibility()
  if (priorIds !== ids) { priorIds = ids; arrange() } else ensureSpacing()
}
onMounted(() => {
  cy = cytoscape({ container: container.value, minZoom: 0.08, maxZoom: 3, wheelSensitivity: 0.2, boxSelectionEnabled: false, autounselectify: true,
    style: [
      { selector: 'node', style: { width: 76, height: 76, 'background-color': '#ffffff', 'border-color': 'data(color)', 'border-width': 2, label: 'data(label)', color: '#33443d', 'font-family': 'Microsoft YaHei, sans-serif', 'font-size': 15, 'text-valign': 'center', 'text-halign': 'center', 'text-wrap': 'wrap', 'text-max-width': '66px', 'overlay-opacity': 0, 'transition-property': 'opacity', 'transition-duration': 160 } },
      { selector: 'node.avatar', style: { 'background-image': 'data(avatar)', 'background-fit': 'cover', 'text-valign': 'bottom', 'text-margin-y': 9, 'text-background-color': '#fafbf8', 'text-background-opacity': 0.9, 'text-background-padding': '3px' } },
      { selector: 'edge', style: { width: 1.3, 'line-color': '#b6c4bc', 'target-arrow-color': '#93a79b', 'source-arrow-color': '#93a79b', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'control-point-step-size': 42, 'arrow-scale': 0.8, label: 'data(label)', 'font-family': 'Microsoft YaHei, sans-serif', 'font-size': 12, color: '#69766d', 'text-background-color': '#fafbf8', 'text-background-opacity': 1, 'text-background-padding': '4px', 'text-rotation': 'autorotate', 'text-margin-y': -1, 'overlay-opacity': 0 } },
      { selector: 'edge.two-way', style: { 'source-arrow-shape': 'triangle' } },
      { selector: 'node.chosen', style: { 'border-width': 3, 'background-color': '#e5efea', 'underlay-color': '#5b8b73', 'underlay-opacity': 0.12, 'underlay-padding': 10, 'underlay-shape': 'ellipse' } },
      { selector: 'edge.chosen', style: { width: 2.5, 'line-color': '#54846f', 'target-arrow-color': '#54846f', 'source-arrow-color': '#54846f', color: '#315e48' } },
      { selector: '.dimmed', style: { opacity: 0.15 } }, { selector: '.hidden', style: { display: 'none' } },
      { selector: 'edge.no-label', style: { label: '' } }
    ] })
  cy.on('tap', 'node', e => emit('select', 'character', e.target.data('rawId')))
  cy.on('tap', 'edge', e => emit('select', 'relation', e.target.data('rawId')))
  cy.on('tap', e => { if (e.target === cy) emit('select', 'none', '') })
  cy.on('zoom', () => emit('zoom', Math.round(cy.zoom() * 100)))
  cy.on('dragfree', 'node', ensureSpacing)
  cy.on('mouseover', 'node, edge', () => { if (container.value) container.value.style.cursor = 'pointer' })
  cy.on('mouseout', 'node, edge', () => { if (container.value) container.value.style.cursor = 'grab' })
  observer = new ResizeObserver(() => cy.resize()); observer.observe(container.value!)
  sync()
})
watch(() => props.data, sync, { deep: true })
watch(() => [props.selected, props.labels, props.neighborhood], applyVisibility)
watch(() => [props.group, props.layout], async () => { applyVisibility(); await nextTick(); arrange() })
function focus(id: string) { const node = cy?.getElementById(`c:${id}`); if (node?.length) cy.animate({ center: { eles: node }, zoom: Math.max(0.85, cy.zoom()), duration: 250 }) }
function zoomBy(factor: number) { cy?.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }) }
function fit() { cy?.fit(cy.elements(':visible'), 65) }
defineExpose({ arrange, focus, zoomBy, fit })
onBeforeUnmount(() => { activeLayout?.stop(); observer?.disconnect(); cy?.destroy() })
</script>
<template><div ref="container" class="graph-canvas" role="img" aria-label="可交互角色关系图，滚轮缩放，拖动平移；也可通过左侧角色列表选择角色" /></template>
