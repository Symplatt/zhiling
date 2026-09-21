import { type Atlas, parseAtlas, uid } from './model'
import { parseColorHistory } from './colors'
export type Theme = 'mono' | 'grass' | 'pink' | 'blue' | 'gold'
export const themes: { id: Theme; name: string; description: string; color: string; background: string }[] = [
  { id: 'mono', name: '黑白灰', description: '留白与秩序', color: '#555b64', background: '#e4e5e7' },
  { id: 'grass', name: '浅草', description: '草木间的清新', color: '#4c7655', background: '#f1f6eb' },
  { id: 'pink', name: '桃粉', description: '温柔的春日', color: '#b66683', background: '#eddee3' },
  { id: 'blue', name: '碧蓝', description: '晴空与远海', color: '#347eaa', background: '#dee8ef' },
  { id: 'gold', name: '金夜', description: '夜色中的微光', color: '#d6b86a', background: '#191b23' }
]
export interface Story { id: string; updatedAt: string; data: Atlas }
export interface Library { version: 2; activeId: string; theme: Theme; graphs: Story[]; customColors?: string[] }
export function story(data: Atlas): Story { return { id: uid('story'), updatedAt: new Date().toISOString(), data } }
export function createLibrary(data: Atlas): Library { const entry = story(data); return { version: 2, activeId: entry.id, theme: 'grass', graphs: [entry] } }
export function parseLibrary(input: unknown): Library {
  if (!input || typeof input !== 'object') throw new Error('关系网书架格式错误。')
  const raw = input as Record<string, unknown>
  if (raw.version !== 2) return createLibrary(parseAtlas(input).data)
  if (!Array.isArray(raw.graphs) || raw.graphs.length < 1 || raw.graphs.length > 1000) throw new Error('书架需要包含 1–1,000 张关系网。')
  const ids = new Set<string>()
  const graphs = raw.graphs.map((item): Story => {
    if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('书架的关系网 ID 缺失或重复。')
    ids.add(item.id)
    return { id: item.id, updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(), data: parseAtlas(item.data).data }
  })
  return { version: 2, activeId: ids.has(String(raw.activeId)) ? String(raw.activeId) : graphs[0]!.id, theme: themes.some(t => t.id === raw.theme) ? raw.theme as Theme : 'grass', graphs, customColors: parseColorHistory(raw.customColors) }
}
