import type { Core } from 'cytoscape'
import { nodeSizeScale } from '../layoutDensity'

/** Keep the preference in the stylesheet so PNG snapshots use the same labels. */
export function applyAvatarNames(cy: Core, visible: boolean) {
  cy.style().selector('node.has-avatar').style({ label: visible ? 'data(label)' : '' }).update()
}

/** Keep labels and strokes proportional, including the selected-edge overrides. */
export function applyGraphSize(cy: Core, level: number) {
  const scale = nodeSizeScale(level)
  cy.style()
    .selector('node').style({ width: 76 * scale, height: 76 * scale,
      'font-size': 15 * scale, 'text-max-width': `${66 * scale}px` })
    .selector('node.has-avatar').style({ 'text-max-width': `${160 * scale}px`, 'text-margin-x': 0, 'text-margin-y': 10 * scale })
    .selector('edge').style({ 'font-size': 15 * scale, width: 1.3 * scale, 'arrow-scale': .8 * scale,
      'text-background-padding': `${4 * scale}px` })
    .selector('edge.connected').style({ width: 2 * scale, 'arrow-scale': .9 * scale })
    .selector('edge.chosen').style({ width: 2.5 * scale })
    .selector('edge[parallelCount > 1]').style({ 'control-point-step-size': 65 * scale })
    .update()
}
