import { expect, it } from 'vitest';
import { createLibrary, parseLibrary, exportLibrary } from '../src/library';
import { centredSquare, parseAvatar } from '../src/avatars';
import { parseAtlas } from '../src/model';
const atlas = { version: 1 as const, title: '合成图', characters: [{ id: 'a', name: '甲' }, { id: 'b', name: '乙' }], relations: [] };
it('restores only valid local coordinates while removing them from portable libraries', () => {
  const library = createLibrary(atlas);
  library.localLayouts = { [library.activeId]: { a: { x: 123, y: -456 }, b: { x: NaN, y: 1 }, missing: { x: 3, y: 4 } } };
  const loaded = parseLibrary(library, true);
  expect(loaded.localLayouts![library.activeId]).toEqual({ a: { x: 123, y: -456 } });
  expect(exportLibrary(loaded)).not.toHaveProperty('localLayouts');
  expect(parseLibrary(library)).not.toHaveProperty('localLayouts');
  expect(loaded.localLayouts![library.activeId]!.a).toEqual({ x: 123, y: -456 });
});
it('crops portrait and landscape images to the largest centred square', () => {
  expect(centredSquare(900, 300)).toEqual({ x: 300, y: 0, side: 300 });
  expect(centredSquare(300, 900)).toEqual({ x: 0, y: 300, side: 300 });
  expect(centredSquare(400, 400)).toEqual({ x: 0, y: 0, side: 400 });
});
it('retains embedded raster avatars in JSON but rejects external paths and SVG', () => {
  const avatar = 'data:image/png;base64,iVBORw0KGgo=';
  const result = parseAtlas({ ...atlas, characters: [{ ...atlas.characters[0], avatar, position: { x: 1, y: 2 } }], positions: { a: { x: 1, y: 2 } } }).data;
  expect(result.characters[0]!.avatar).toBe(avatar);
  expect(result.characters[0]).not.toHaveProperty('position');
  expect(result).not.toHaveProperty('positions');
  expect(parseAvatar('data:image/svg+xml;base64,abcd')).toBeUndefined();
  expect(parseAvatar('https://example.com/avatar.png')).toBeUndefined();
});
