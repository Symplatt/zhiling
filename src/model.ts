export const palette = ['#4f8072', '#a97f5c', '#8480a7', '#678ca3', '#b27081', '#798660']
export interface Character {
  id: string; name: string; group?: string; color?: string; notes?: string; tags?: string[]
  [key: string]: unknown
}
export interface Relation {
  id: string; from: string; to: string; label: string; direction: 'one-way' | 'two-way'; description?: string
  mode?: 'shared' | 'paired'; reverseLabel?: string
  [key: string]: unknown
}
export interface Atlas {
  version: 1; title: string; description: string; characters: Character[]; relations: Relation[]
  [key: string]: unknown
}
export function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const str = (v: unknown, fallback = '') => typeof v === 'string' ? v : fallback
export function splitTags(value: string) { return [...new Set(value.trim().split(/\s+/u).filter(Boolean))] }
export function relationLabel(r: Relation) { return r.direction === 'two-way' && r.mode === 'paired' ? `${r.label}/${r.reverseLabel || ''}` : r.label }
export function relationFrom(r: Relation, id: string) {
  if (r.direction === 'two-way' && r.mode === 'paired') return id === r.from ? `${r.label} / 对方：${r.reverseLabel}` : `${r.reverseLabel} / 对方：${r.label}`
  return r.direction === 'two-way' ? r.label : id === r.from ? `→ ${r.label}` : `← ${r.label}`
}
export function parseAtlas(input: unknown): { data: Atlas; warnings: string[] } {
  if (!object(input) || !Array.isArray(input.characters) || !Array.isArray(input.relations)) throw new Error('文件需要包含 characters 和 relations 两个数组。')
  if (input.version !== undefined && input.version !== 1) throw new Error('暂不支持此数据版本，请使用 version: 1。')
  if (input.characters.length > 2000 || input.relations.length > 20000) throw new Error('单个关系网最多支持 2,000 个角色和 20,000 条关系。')
  const warnings: string[] = [], ids = new Set<string>(), edgeIds = new Set<string>()
  const characters = input.characters.map((raw, i): Character => {
    if (!object(raw) || !str(raw.id).trim() || !str(raw.name).trim()) throw new Error(`第 ${i + 1} 个角色缺少有效的 id 或 name。`)
    const id = str(raw.id).trim(), name = str(raw.name).trim()
    if (ids.has(id)) throw new Error(`角色 ID「${id}」重复。请为每个角色设置唯一 ID 后重新导入。`)
    ids.add(id)
    if (name.length > 60 || id.length > 200) throw new Error(`角色「${name.slice(0, 20)}」的名称或 ID 过长。`)
    const { avatar: _legacyAvatar, ...fields } = raw
    return { ...fields, id, name, group: str(raw.group, '未分组'), color: /^#[0-9a-f]{6}$/i.test(str(raw.color)) ? str(raw.color) : palette[0], notes: str(raw.notes), tags: typeof raw.tags === 'string' ? splitTags(raw.tags) : Array.isArray(raw.tags) ? raw.tags.filter((x): x is string => typeof x === 'string') : [] }
  })
  const relations = input.relations.map((raw, i): Relation => {
    if (!object(raw)) throw new Error(`第 ${i + 1} 条关系格式不正确。`)
    const from = str(raw.from).trim(), to = str(raw.to).trim()
    if (!ids.has(from) || !ids.has(to)) throw new Error(`第 ${i + 1} 条关系引用了不存在的角色（${from} → ${to}）。`)
    const id = str(raw.id).trim() || `relation-${i + 1}`
    if (edgeIds.has(id)) throw new Error(`关系 ID「${id}」重复。`)
    edgeIds.add(id)
    if (raw.direction !== undefined && raw.direction !== 'one-way' && raw.direction !== 'two-way') throw new Error(`第 ${i + 1} 条关系的 direction 需要为 one-way 或 two-way。`)
    const mode = raw.mode === 'paired' ? 'paired' : 'shared'
    if (raw.direction === 'two-way' && mode === 'paired' && !str(raw.reverseLabel).trim()) throw new Error(`第 ${i + 1} 条关系缺少 B 对 A 的关系。`)
    return { ...raw, id, from, to, label: str(raw.label, '关联'), direction: raw.direction === 'two-way' ? 'two-way' : 'one-way', mode, reverseLabel: str(raw.reverseLabel), description: str(raw.description) }
  })
  return { data: { ...input, version: 1, title: str(input.title, '未命名故事'), description: str(input.description), characters, relations }, warnings }
}
export function removeCharacter(data: Atlas, id: string): Atlas {
  return { ...data, characters: data.characters.filter(c => c.id !== id), relations: data.relations.filter(r => r.from !== id && r.to !== id) }
}
export function addCharacter(data: Atlas, character: Character): Atlas {
  if (data.characters.some(c => c.id === character.id)) throw new Error('角色 ID 已存在。')
  if (!character.id.trim() || !character.name.trim()) throw new Error('请填写角色名称。')
  return { ...data, characters: [...data.characters, character] }
}
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
