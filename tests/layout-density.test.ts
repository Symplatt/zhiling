import { expect, it } from 'vitest';
import cytoscape from 'cytoscape';
import { densityLevels, densityScale } from '../src/layoutDensity';
import { scaleGraphSpacing } from '../src/graph/layout';
import { createLibrary, parseLibrary } from '../src/library';
import { createSample } from '../src/sample';

it('keeps the original layout at level 1 and increases spacing without cumulative drift', () => {
  const cy = cytoscape({ headless: true, styleEnabled: true, layout: { name: 'preset' }, elements: [
    { data: { id: 'a' }, position: { x: 20, y: 40 } },
    { data: { id: 'b' }, position: { x: 320, y: 440 } },
    { data: { id: 'hidden' }, position: { x: 999, y: 777 }, style: { display: 'none' } },
  ] });
  try {
    let previous = 1;
    for (const level of [...densityLevels, 1, 5, 1]) {
      scaleGraphSpacing(cy, densityScale(level) / densityScale(previous));
      const a = cy.$id('a').position(), b = cy.$id('b').position();
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(500 * (1 + (level - 1) * .2));
      expect((a.x + b.x) / 2).toBeCloseTo(170);
      expect((a.y + b.y) / 2).toBeCloseTo(240);
      expect(cy.$id('hidden').position()).toEqual({ x: 999, y: 777 });
      previous = level;
    }
  } finally { cy.destroy(); }
});

it('restores density from saved libraries and safely defaults old or invalid values', () => {
  const library = createLibrary(createSample());
  expect(parseLibrary(library).layoutDensity).toBe(1);
  for (const level of densityLevels) {
    library.layoutDensity = level;
    expect(parseLibrary(JSON.parse(JSON.stringify(library))).layoutDensity).toBe(level);
  }
  for (const invalid of [null, 0, 6, 2.5, '5', NaN]) {
    expect(parseLibrary({ ...library, layoutDensity: invalid }).layoutDensity).toBe(1);
  }
});
