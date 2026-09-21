import type { Character, Relation } from "./model";

export function characterGroups(
  character: Pick<Character, "groups" | "group">,
): string[] {
  const values = Array.isArray(character.groups)
    ? character.groups
    : character.group
      ? [character.group]
      : [];
  return [
    ...new Set(
      values
        .filter((g): g is string => typeof g === "string")
        .map((g) => g.trim())
        .filter((g) => g && g !== "未分组"),
    ),
  ];
}
export function belongsToGroup(
  character: Pick<Character, "groups" | "group">,
  group: string,
): boolean {
  const groups = characterGroups(character);
  return (
    !group || (group === "未分组" ? !groups.length : groups.includes(group))
  );
}
const pinyin = new Intl.Collator("zh-CN-u-co-pinyin", {
  numeric: true,
  sensitivity: "base",
});
export function sortCharacters(characters: readonly Character[]): Character[] {
  return [...characters].sort(
    (a, b) => pinyin.compare(a.name, b.name) || a.id.localeCompare(b.id),
  );
}
export type InitialDirection = "one-way" | "two-way" | "reverse";
export function initialRelation(
  newId: string,
  otherId: string,
  direction: InitialDirection,
): Pick<Relation, "from" | "to" | "direction"> {
  return {
    from: direction === "reverse" ? otherId : newId,
    to: direction === "reverse" ? newId : otherId,
    direction: direction === "two-way" ? "two-way" : "one-way",
  };
}
