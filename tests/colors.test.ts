import { describe, it, expect } from 'vitest';
import { parseRgbColor, rememberCustomColor, parseColorHistory } from '../src/colors';
import { createLibrary, parseLibrary } from '../src/library';
import { createSample } from '../src/sample';
describe('自定义角色颜色', () => {
  it('接受十六进制、RGB 函数及三通道数字，统一保存为六位十六进制', () => {
    for (const value of ['#6B8E73', '6b8e73', 'rgb(107, 142, 115)', '107,142,115', '107 142 115', '107，142，115']) {
      expect(parseRgbColor(value)).toBe('#6b8e73');
    }
    expect(parseRgbColor('rgb(0, 0, 0)')).toBe('#000000');
    expect(parseRgbColor('255,255,255')).toBe('#ffffff');
  });
  it('拒绝越界、小数、缺失通道和无效代码', () => {
    for (const value of ['', '#xxx123', '#123', '-1,0,0', '256,0,0', '1.5,0,0', '1,2', 'rgb(1,2,3', '1,,2,3', 'rgba(1,2,3,1)']) {
      expect(() => parseRgbColor(value)).toThrow();
    }
  });
  it('严格按添加顺序先进先出，只保留七种；重复颜色不占位也不改变顺序', () => {
    let history: string[] = [];
    for (let i = 0; i < 9; i++) history = rememberCustomColor(history, `${i},0,0`);
    expect(history).toEqual(['#020000','#030000','#040000','#050000','#060000','#070000','#080000']);
    expect(rememberCustomColor(history, '2,0,0')).toEqual(history);
    expect(rememberCustomColor(history, '#090000')).toEqual([...history.slice(1),'#090000']);
  });
  it('历史随书架保存重载，旧书架与无效历史兼容', () => {
    const library = createLibrary(createSample());
    expect(parseLibrary(library).customColors).toEqual([]);
    library.customColors = ['#123456', '#ffffff'];
    expect(parseLibrary(JSON.parse(JSON.stringify(library))).customColors).toEqual(library.customColors);
    expect(parseColorHistory(['broken', 23, '#ABCDEF', 'rgb(171,205,239)'])).toEqual(['#abcdef']);
  });
});
