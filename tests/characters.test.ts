import { expect, it } from "vitest";
import {
  characterGroups,
  belongsToGroup,
  initialRelation,
  sortCharacters,
} from "../src/characters";
import { parseAtlas } from "../src/model";
import { hexToHsv, hsvToHex } from "../src/colorPicker";

it("migrates single factions and round-trips multiple memberships without duplicates", () => {
  const result = parseAtlas({
    characters: [
      { id: "a", name: "阿青", group: "花家" },
      { id: "b", name: "白露", groups: ["花家", "云岫门", "花家", " "] },
      { id: "c", name: "云间", groups: [], group: "旧阵营" },
    ],
    relations: [],
  }).data;
  expect(characterGroups(result.characters[0]!)).toEqual(["花家"]);
  expect(characterGroups(result.characters[1]!)).toEqual(["花家", "云岫门"]);
  expect(characterGroups(result.characters[2]!)).toEqual([]);
  expect(belongsToGroup(result.characters[1]!, "花家")).toBe(true);
  expect(belongsToGroup(result.characters[1]!, "云岫门")).toBe(true);
  expect(belongsToGroup(result.characters[1]!, "未分组")).toBe(false);
  expect(belongsToGroup(result.characters[2]!, "未分组")).toBe(true);
  expect(parseAtlas(result).data).toEqual(result);
  expect(result.characters[0]).not.toHaveProperty("group");
  expect(() =>
    parseAtlas({
      characters: [{ id: "x", name: "错误", groups: "花家" }],
      relations: [],
    }),
  ).toThrow("groups");
});
it("sorts Chinese names by pinyin without changing the source array", () => {
  const names = ["张三", "李四", "白露", "阿青", "云间"];
  const source = names.map((name, index) => ({ id: String(index), name }));
  expect(sortCharacters(source).map((c) => c.name)).toEqual([
    "阿青",
    "白露",
    "李四",
    "云间",
    "张三",
  ]);
  expect(source.map((c) => c.name)).toEqual(names);
});
it("creates each initial relationship with the correct endpoints", () => {
  expect(initialRelation("new", "old", "reverse")).toEqual({
    from: "old",
    to: "new",
    direction: "one-way",
  });
  expect(initialRelation("new", "old", "one-way")).toEqual({
    from: "new",
    to: "old",
    direction: "one-way",
  });
  expect(initialRelation("new", "old", "two-way")).toEqual({
    from: "new",
    to: "old",
    direction: "two-way",
  });
});
it("round-trips HSV across black, grey, primaries and custom RGB values", () => {
  for (const hex of [
    "#000000",
    "#ffffff",
    "#777777",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#6b8e73",
    "#b27081",
  ]) {
    const { h, s, v } = hexToHsv(hex);
    expect(hsvToHex(h, s, v)).toBe(hex);
  }
  expect(hsvToHex(360, 1, 1)).toBe("#ff0000");
});
