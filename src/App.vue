<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Network, Search, Plus, Upload, Download, Check, CheckCheck, ChevronDown, ChevronRight, X, ArrowUpRight, ArrowRight, ArrowLeftRight, Users, Link2, SlidersHorizontal, Maximize, Minus, RotateCcw, Undo2, Redo2, Pencil, Trash2, ImagePlus, Focus, CircleHelp, BookOpen, FilePlus2, Save, PanelRightClose, PanelRightOpen, Sparkles, Settings2, CircleDot, FolderOpen, AlertCircle } from 'lucide-vue-next'
import RelationshipGraph from './components/RelationshipGraph.vue'
import { type Atlas, type Character, type Relation, palette, parseAtlas, uid, clone, addCharacter, removeCharacter } from './model'
import { createSample } from './sample'

const data = ref<Atlas>(createSample())
const ready = ref(false), recoveryBlocked = ref(false), saveStatus = ref('正在载入'), query = ref(''), group = ref(''), selectedId = ref('huaying'), selectedKind = ref<'character' | 'relation' | 'none'>('character')
const labels = ref(true), neighborhood = ref(false), layout = ref('fcose'), inspector = ref(true), zoom = ref(100)
const graph = ref<InstanceType<typeof RelationshipGraph>>()
const modal = ref(''), formError = ref(''), toast = ref(''), toastError = ref(false)
const jsonInput = ref<HTMLInputElement>(), avatarInput = ref<HTMLInputElement>()
const draftCharacter = ref({ id: '', name: '', group: '', color: palette[0]!, notes: '', avatar: '', tags: '', initialTo: '', initialLabel: '朋友', initialDirection: 'two-way' as 'one-way' | 'two-way' })
const draftRelation = ref({ id: '', from: '', to: '', label: '', direction: 'one-way' as 'one-way' | 'two-way', description: '' })
const draftProject = ref({ title: '', description: '' })
const isEditing = ref(false), pendingImport = ref<{ data: Atlas; warnings: string[] } | null>(null)
const undoStack = ref<Atlas[]>([]), redoStack = ref<Atlas[]>([])
const confirmation = ref<{ title: string; description: string; action: () => void; destructive: boolean } | null>(null)
let toastTimer: ReturnType<typeof setTimeout>, saveNumber = 0
const groups = computed(() => [...new Set(data.value.characters.map(c => c.group || '未分组'))])
const characters = computed(() => data.value.characters.filter(c => (!group.value || (c.group || '未分组') === group.value) && `${c.name} ${c.id} ${c.tags?.join(' ')}`.toLowerCase().includes(query.value.toLowerCase())))
const character = computed(() => selectedKind.value === 'character' ? data.value.characters.find(c => c.id === selectedId.value) : undefined)
const relation = computed(() => selectedKind.value === 'relation' ? data.value.relations.find(r => r.id === selectedId.value) : undefined)
const linked = computed(() => character.value ? data.value.relations.filter(r => r.from === character.value!.id || r.to === character.value!.id) : [])
const selection = computed(() => selectedKind.value === 'none' ? '' : `${selectedKind.value === 'character' ? 'c' : 'r'}:${selectedId.value}`)
const connectedPeople = computed(() => new Set(linked.value.flatMap(r => [r.from, r.to]).filter(id => id !== character.value?.id)).size)
const name = (id: string) => data.value.characters.find(c => c.id === id)?.name || id
function notify(message: string, error = false) { clearTimeout(toastTimer); toast.value = message; toastError.value = error; if (!error) toastTimer = setTimeout(() => toast.value = '', 4200) }
function errorMessage(e: unknown) { return e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : String(e) }
async function persist(showToast = false) {
  if (!ready.value || recoveryBlocked.value) return
  const number = ++saveNumber
  saveStatus.value = '保存中…'
  try {
    const snapshot = clone(data.value)
    if (window.desktop) await window.desktop.save(snapshot)
    else localStorage.setItem('novel-atlas-v1', JSON.stringify(snapshot))
    if (number === saveNumber) saveStatus.value = '已自动保存'
    if (showToast) notify('关系网已保存到本机')
  } catch (e) { saveStatus.value = '保存失败'; notify(`保存失败：${errorMessage(e)}。请导出 JSON 备份。`, true); throw e }
}
function commit(next: Atlas) {
  undoStack.value.push(clone(data.value)); if (undoStack.value.length > 30) undoStack.value.shift()
  redoStack.value = []; data.value = next; recoveryBlocked.value = false
  void persist().catch(() => {})
}
function undo() { const prior = undoStack.value.pop(); if (!prior) return; redoStack.value.push(clone(data.value)); data.value = prior; cleanSelection(); void persist().catch(() => {}) }
function redo() { const next = redoStack.value.pop(); if (!next) return; undoStack.value.push(clone(data.value)); data.value = next; cleanSelection(); void persist().catch(() => {}) }
function cleanSelection() { if (selectedKind.value === 'character' && !character.value || selectedKind.value === 'relation' && !relation.value) { selectedKind.value = 'none'; selectedId.value = '' } if (group.value && !groups.value.includes(group.value)) group.value = '' }
function select(kind: 'character' | 'relation' | 'none', id: string, focus = false) { selectedKind.value = kind; selectedId.value = id; if (kind !== 'none') inspector.value = true; if (focus) graph.value?.focus(id) }
function openModal(kind: string) { formError.value = ''; modal.value = kind }
function editCharacter(c?: Character) {
  isEditing.value = !!c
  draftCharacter.value = { id: c?.id || uid('character'), name: c?.name || '', group: c?.group || group.value || '', color: c?.color || palette[groups.value.length % palette.length]!, notes: c?.notes || '', avatar: c?.avatar || '', tags: c?.tags?.join('，') || '', initialTo: '', initialLabel: '朋友', initialDirection: 'two-way' }
  openModal('character')
}
function submitCharacter() {
  try {
    const d = draftCharacter.value, existing = data.value.characters.find(c => c.id === d.id)
    const c: Character = { ...existing, id: d.id, name: d.name.trim(), group: d.group.trim() || '未分组', color: d.color, notes: d.notes, avatar: d.avatar, tags: d.tags.split(/[,，]/).map(x => x.trim()).filter(Boolean) }
    if (!c.name) throw new Error('请填写角色名称。')
    let next = isEditing.value ? { ...data.value, characters: data.value.characters.map(old => old.id === c.id ? c : old) } : addCharacter(data.value, c)
    if (!isEditing.value && d.initialTo) {
      if (!d.initialLabel.trim()) throw new Error('请填写初始关系名称。')
      next = { ...next, relations: [...next.relations, { id: uid('relation'), from: c.id, to: d.initialTo, label: d.initialLabel.trim(), direction: d.initialDirection }] }
    }
    commit(parseAtlas(next).data); group.value = ''; select('character', c.id); modal.value = ''; notify(isEditing.value ? '角色档案已更新' : `已添加角色「${c.name}」`)
  } catch (e) { formError.value = errorMessage(e) }
}
function editRelation(r?: Relation) {
  isEditing.value = !!r
  draftRelation.value = { id: r?.id || uid('relation'), from: r?.from || character.value?.id || data.value.characters[0]?.id || '', to: r?.to || data.value.characters.find(c => c.id !== character.value?.id)?.id || '', label: r?.label || '', direction: r?.direction || 'one-way', description: r?.description || '' }
  openModal('relation')
}
function submitRelation() {
  try {
    const d = draftRelation.value
    if (!d.from || !d.to || !d.label.trim()) throw new Error('请选择两端角色并填写关系名称。')
    const r = { ...data.value.relations.find(r => r.id === d.id), ...d, label: d.label.trim() }
    const next = { ...data.value, relations: isEditing.value ? data.value.relations.map(old => old.id === r.id ? r : old) : [...data.value.relations, r] }
    commit(parseAtlas(next).data); select('relation', r.id); modal.value = ''; notify('关系已保存')
  } catch (e) { formError.value = errorMessage(e) }
}
function askConfirmation(title: string, description: string, action: () => void, destructive = false) { confirmation.value = { title, description, action, destructive }; openModal('confirm') }
function deleteCharacter(c: Character) { askConfirmation(`删除「${c.name}」？`, `同时移除与该角色有关的 ${linked.value.length} 条关系。此操作可以撤销。`, () => { commit(removeCharacter(data.value, c.id)); select('none', ''); modal.value = ''; notify('角色已删除，可点击撤销恢复') }, true) }
function deleteRelation(r: Relation) { askConfirmation('删除这条关系？', `${name(r.from)} ${r.direction === 'two-way' ? '↔' : '→'} ${name(r.to)} · ${r.label}。此操作可以撤销。`, () => { commit({ ...data.value, relations: data.value.relations.filter(old => old.id !== r.id) }); select('none', ''); modal.value = ''; notify('关系已删除') }, true) }
function newProject() { askConfirmation('开始一个新故事', '当前内容已自动保存在本机。新建会替换当前关系网，建议先导出 JSON 留存；本次会话中可以撤销。', () => { commit({ version: 1, title: '未命名故事', description: '从一个角色开始，编织你的故事。', characters: [], relations: [] }); group.value = ''; query.value = ''; select('none', ''); modal.value = ''; editProject() }) }
function editProject() { draftProject.value = { title: data.value.title, description: data.value.description }; openModal('project') }
function submitProject() { if (!draftProject.value.title.trim()) { formError.value = '请填写故事名称。'; return } commit({ ...data.value, title: draftProject.value.title.trim(), description: draftProject.value.description }); modal.value = '' }
async function importJson() {
  if (!window.desktop) { jsonInput.value?.click(); return }
  try { const result = await window.desktop.importJson(); if (result) previewImport(result.data, result.warnings) } catch (e) { notify(`导入失败：${errorMessage(e)}`, true) }
}
function previewImport(input: unknown, warnings: string[] = []) { const parsed = parseAtlas(input); pendingImport.value = { data: parsed.data, warnings: [...warnings, ...parsed.warnings] }; openModal('import') }
async function readJson(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = ''
  if (!file) return
  try { if (file.size > 64 * 1024 * 1024) throw new Error('文件不能超过 64 MB。'); previewImport(JSON.parse((await file.text()).replace(/^\uFEFF/, ''))) } catch (e) { notify(`导入失败：${errorMessage(e)}`, true) }
}
function confirmImport() { if (!pendingImport.value) return; commit(pendingImport.value.data); group.value = ''; query.value = ''; select(data.value.characters.length ? 'character' : 'none', data.value.characters[0]?.id || ''); modal.value = ''; notify('关系网已导入并保存'); pendingImport.value = null }
async function exportJson() {
  try {
    if (window.desktop) { if (await window.desktop.exportJson(clone(data.value))) notify('JSON 已导出，头像已包含在文件内') }
    else { const url = URL.createObjectURL(new Blob([JSON.stringify(data.value, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `${data.value.title.replace(/[<>:"/\\|?*]/g, '_')}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('JSON 已导出') }
  } catch (e) { notify(`导出失败：${errorMessage(e)}`, true) }
}
async function chooseAvatar() { if (!window.desktop) { avatarInput.value?.click(); return } try { const result = await window.desktop.chooseAvatar(); if (result) draftCharacter.value.avatar = result } catch (e) { formError.value = errorMessage(e) } }
async function readAvatar(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = ''
  if (!file) return
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 5 * 1024 * 1024) { formError.value = '请选择不超过 5 MB 的 PNG、JPG、WebP 或 GIF 图片。'; return }
  const reader = new FileReader(); reader.onload = () => { draftCharacter.value.avatar = String(reader.result); formError.value = '' }; reader.readAsDataURL(file)
}
function keydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { modal.value = ''; return }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void persist(true).catch(() => {}); return }
  const editing = (e.target as HTMLElement)?.matches('input, textarea, select, [contenteditable]')
  if (!editing && !modal.value && (e.ctrlKey || e.metaKey)) {
    if (e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
    if (e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
  }
}
watch(modal, value => { if (value) setTimeout(() => (document.querySelector<HTMLElement>('.modal input:not([type=file])') || document.querySelector<HTMLElement>('.modal button'))?.focus(), 50) })
function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab') return
  const elements = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type=file]), textarea, select, [tabindex="0"]')].filter(el => el.offsetParent !== null)
  const first = elements[0], last = elements.at(-1)
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
}
onMounted(async () => {
  document.addEventListener('keydown', keydown)
  try {
    if (window.desktop) {
      const result = await window.desktop.load()
      if (result.data) data.value = parseAtlas(result.data).data
      if (result.error) { notify(result.error, true); if (!result.data) recoveryBlocked.value = true }
      window.desktop.onClosing(async () => { try { await persist(); await window.desktop!.close() } catch { /* 保留窗口，让用户导出备份。 */ } })
    } else {
      const text = localStorage.getItem('novel-atlas-v1'); if (text) data.value = parseAtlas(JSON.parse(text)).data
    }
    select(data.value.characters.length ? 'character' : 'none', data.value.characters[0]?.id || '')
  } catch (e) { recoveryBlocked.value = true; notify(`无法载入上次的数据，原文件未覆盖：${errorMessage(e)}`, true) }
  ready.value = true; saveStatus.value = recoveryBlocked.value ? '需要恢复数据' : '已自动保存'
  if (!recoveryBlocked.value) void persist().catch(() => {})
})
onBeforeUnmount(() => { document.removeEventListener('keydown', keydown); clearTimeout(toastTimer) })
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand"><div class="brand-mark"><Network :size="22" /></div><strong>知交</strong><span class="brand-divider"></span><span class="brand-caption">角色关系网</span></div>
      <div class="header-center"><span class="local-dot"></span>本地工作空间</div>
      <div class="header-actions"><button class="text-button" @click="importJson"><Upload :size="15" />导入 JSON</button><button class="text-button" @click="exportJson"><Download :size="15" />导出</button><span class="vertical-divider"></span><button class="save-button" @click="persist(true).catch(() => {})"><Save :size="14" />保存</button><button class="icon-button" title="使用帮助" aria-label="使用帮助" @click="openModal('help')"><CircleHelp :size="18" /></button></div>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <div class="project-card"><div class="eyebrow">我的故事 <span>01</span></div><button class="project-title" @click="editProject"><span>{{ data.title }}</span><ChevronDown :size="15" /></button><p>每一个人，都有一条故事线。</p><button class="workspace-tab" @click="group = ''; query = ''; graph?.fit()"><Network :size="16" />人物关系图<span>{{ data.characters.length }}</span></button></div>
        <div class="characters-panel"><div class="section-heading"><span>角色</span><span class="count">{{ data.characters.length }}</span><button class="icon-button small" aria-label="添加角色" title="添加角色" @click="editCharacter()"><Plus :size="17" /></button></div>
          <div class="search-box"><Search :size="15" /><input v-model="query" placeholder="搜索角色、标签…" aria-label="搜索角色" /><kbd v-if="!query">⌕</kbd><button v-else class="clear-search" aria-label="清除搜索" @click="query = ''"><X :size="13" /></button></div>
          <div class="filter-row"><span>{{ group || '全部角色' }}</span><select v-model="group" aria-label="按阵营筛选"><option value="">全部阵营</option><option v-for="g in groups" :key="g">{{ g }}</option></select></div>
          <div class="character-list"><button v-for="c in characters" :key="c.id" class="character-item" :class="{ active: character?.id === c.id }" @click="select('character', c.id, true)"><span class="avatar small-avatar" :style="{ '--character-color': c.color || palette[0] }"><img v-if="c.avatar" :src="c.avatar" alt="" /><span v-else>{{ c.name.slice(0, 1) }}</span></span><span class="character-list-info"><strong>{{ c.name }}</strong><small>{{ c.group || '未分组' }}</small></span><span v-if="c.tags?.includes('主角')" class="lead-mark">主角</span><ChevronRight v-if="character?.id === c.id" :size="14" /></button>
            <div v-if="!characters.length" class="list-empty"><Search :size="22" /><p>{{ data.characters.length ? '没有找到匹配的角色' : '你的故事，等待第一位角色' }}</p><button v-if="data.characters.length" class="inline-button" @click="query = ''; group = ''">清除筛选</button></div>
          </div>
          <button class="add-character" @click="editCharacter()"><Plus :size="16" />添加角色</button>
        </div>
        <div class="sidebar-footer"><button class="text-button" @click="newProject"><FilePlus2 :size="16" />新建故事</button><button class="icon-button" aria-label="显示设置" title="显示设置" @click="openModal('settings')"><Settings2 :size="16" /></button></div>
      </aside>

      <main class="main-area">
        <section class="graph-header"><div><div class="breadcrumb">{{ data.title }}<ChevronRight :size="12" /><span>人物关系图</span></div><h1>故事里的人，<span>彼此相连。</span></h1><p>{{ data.description || '让错综复杂的关系，变得一目了然。' }}</p></div><button class="primary-button" @click="editCharacter()"><Plus :size="17" />新增角色</button></section>
        <div class="graph-toolbar"><div class="view-label"><Network :size="16" /><span>关系视图</span></div><span class="vertical-divider"></span><button class="toolbar-button" @click="graph?.arrange()"><Sparkles :size="15" />自动布局</button><button class="toolbar-button" :class="{ toggled: labels }" :aria-pressed="labels" @click="labels = !labels"><span class="text-icon">T</span>关系标签</button><div class="toolbar-spacer"></div><button class="toolbar-button" :disabled="!data.characters.length" @click="editRelation()"><Link2 :size="15" />添加关系</button><button class="icon-button" title="图谱设置" aria-label="图谱设置" @click="openModal('settings')"><SlidersHorizontal :size="16" /></button><button class="icon-button panel-toggle" :title="inspector ? '收起详情' : '展开详情'" :aria-label="inspector ? '收起详情' : '展开详情'" @click="inspector = !inspector"><PanelRightClose v-if="inspector" :size="17" /><PanelRightOpen v-else :size="17" /></button></div>
        <div class="graph-body">
          <div class="canvas-wrap">
            <div class="canvas-caption"><span class="local-dot"></span>{{ group || '全部人物' }}<span> / {{ group ? characters.length : data.characters.length }} 位角色</span></div>
            <RelationshipGraph v-if="ready" ref="graph" :data="data" :selected="selection" :group="group" :labels="labels" :neighborhood="neighborhood" :layout="layout" @select="select" @zoom="zoom = $event" />
            <div v-if="ready && !data.characters.length" class="graph-empty"><div class="empty-network"><Network :size="42" :stroke-width="1.2" /></div><h2>一段故事，从相遇开始</h2><p>添加第一位角色，或导入已有的关系网。</p><button class="primary-button" @click="editCharacter()"><Plus :size="16" />创建第一个角色</button><button class="text-button" @click="importJson"><Upload :size="15" />导入 JSON 文件</button></div>
            <div class="canvas-bottom"><div class="legend"><button v-for="g in groups" :key="g" :class="{ muted: group && group !== g }" @click="group = group === g ? '' : g"><i :style="{ background: data.characters.find(c => (c.group || '未分组') === g)?.color || palette[0] }"></i>{{ g }}</button></div><div class="canvas-hint">滚轮缩放 · 拖动空白处平移</div></div>
            <div class="canvas-controls"><button class="icon-button" aria-label="撤销" title="撤销 Ctrl+Z" :disabled="!undoStack.length" @click="undo"><Undo2 :size="16" /></button><button class="icon-button" aria-label="重做" title="重做 Ctrl+Y" :disabled="!redoStack.length" @click="redo"><Redo2 :size="16" /></button><span class="vertical-divider"></span><button class="icon-button" aria-label="缩小" @click="graph?.zoomBy(0.8)"><Minus :size="16" /></button><span class="zoom-value">{{ zoom }}%</span><button class="icon-button" aria-label="放大" @click="graph?.zoomBy(1.25)"><Plus :size="16" /></button><span class="vertical-divider"></span><button class="icon-button" aria-label="适应画布" title="适应画布" @click="graph?.fit()"><Maximize :size="16" /></button></div>
          </div>
          <aside v-if="inspector" class="inspector">
            <div class="inspector-header"><span>{{ relation ? '关系详情' : '角色档案' }}</span><button class="icon-button small" aria-label="关闭详情" @click="inspector = false"><X :size="15" /></button></div>
            <template v-if="character">
              <div class="profile"><span class="avatar profile-avatar" :style="{ '--character-color': character.color || palette[0] }"><img v-if="character.avatar" :src="character.avatar" :alt="character.name" /><span v-else>{{ character.name.slice(0, 1) }}</span><i></i></span><h2>{{ character.name }}</h2><div class="profile-group"><i :style="{ background: character.color }"></i>{{ character.group || '未分组' }}</div><div class="tags"><span v-for="tag in character.tags" :key="tag">{{ tag }}</span></div><button class="edit-profile" @click="editCharacter(character)"><Pencil :size="13" />编辑档案</button></div>
              <div class="profile-stats"><div><strong>{{ connectedPeople }}</strong><span>关联人物</span></div><span></span><div><strong>{{ linked.length }}</strong><span>人物关系</span></div></div>
              <section class="inspector-section"><h3><BookOpen :size="14" />人物小传</h3><p class="biography">{{ character.notes || '还没有小传。编辑档案，记下这个角色的故事。' }}</p></section>
              <section class="inspector-section relation-section"><h3><Link2 :size="14" />人物关系<span class="count">{{ linked.length }}</span><button class="icon-button small" aria-label="为当前角色添加关系" @click="editRelation()"><Plus :size="15" /></button></h3><div v-if="!linked.length" class="subtle-empty">尚未与其他角色建立关系</div><button v-for="r in linked" :key="r.id" class="relation-row" @click="select('relation', r.id)"><span class="relation-direction"><ArrowLeftRight v-if="r.direction === 'two-way'" :size="15" /><ArrowRight v-else :size="15" :class="{ reversed: r.to === character.id }" /></span><span><strong>{{ name(r.from === character.id ? r.to : r.from) }}</strong><small>{{ r.from === character.id ? '我' : name(r.from) }} {{ r.direction === 'two-way' ? '↔' : '→' }} {{ r.to === character.id ? '我' : name(r.to) }}</small></span><span class="relation-pill">{{ r.label }}</span><ChevronRight :size="12" /></button></section>
              <div class="inspector-foot"><button class="text-button" :class="{ 'focus-active': neighborhood }" @click="neighborhood = !neighborhood"><Focus :size="15" />{{ neighborhood ? '显示全部关系' : '聚焦一度关系' }}</button><button class="icon-button danger-subtle" aria-label="删除当前角色" title="删除角色" @click="deleteCharacter(character)"><Trash2 :size="14" /></button></div>
            </template>
            <template v-else-if="relation"><div class="relation-profile"><div class="relation-symbol"><Link2 :size="26" /></div><h2>{{ relation.label }}</h2><p>{{ relation.direction === 'two-way' ? '双向关系' : '单向关系' }}</p><div class="endpoints"><button @click="select('character', relation.from, true)">{{ name(relation.from) }}</button><ArrowLeftRight v-if="relation.direction === 'two-way'" :size="20" /><ArrowRight v-else :size="20" /><button @click="select('character', relation.to, true)">{{ name(relation.to) }}</button></div><button class="edit-profile" @click="editRelation(relation)"><Pencil :size="13" />编辑关系</button></div><section class="inspector-section"><h3><BookOpen :size="14" />关系描述</h3><p class="biography">{{ relation.description || '还没有补充描述。记录他们相识的缘由，或关系变化的伏笔。' }}</p></section><div class="inspector-foot"><span class="muted-text">每条连线，都是故事。</span><button class="icon-button danger-subtle" aria-label="删除当前关系" @click="deleteRelation(relation)"><Trash2 :size="14" /></button></div></template>
            <div v-else class="no-selection"><CircleDot :size="36" :stroke-width="1" /><h3>走近故事中的人</h3><p>点击一个角色或一条连线，<br />在这里查看和编辑详情。</p></div>
          </aside>
        </div>
        <footer class="status-bar"><span><Users :size="13" />{{ data.characters.length }} 位角色</span><span><Link2 :size="13" />{{ data.relations.length }} 条关系</span><span class="status-separator">·</span><span>让灵感有迹可循</span><div class="toolbar-spacer"></div><span :class="{ 'error-text': saveStatus === '保存失败' || recoveryBlocked }"><CheckCheck v-if="saveStatus === '已自动保存'" :size="14" /><AlertCircle v-else :size="14" />{{ saveStatus }}</span><span class="local-badge">仅存储在本机</span></footer>
      </main>
    </div>
    <Transition name="toast"><div v-if="toast" class="toast-message" :class="{ error: toastError }" role="status"><AlertCircle v-if="toastError" :size="18" /><Check v-else :size="18" /><span>{{ toast }}</span><button class="icon-button small" aria-label="关闭提示" @click="toast = ''"><X :size="14" /></button></div></Transition>
    <input ref="jsonInput" type="file" accept=".json,application/json" class="hidden-input" aria-label="导入 JSON 文件" @change="readJson" />
    <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden-input" aria-label="选择头像文件" @change="readAvatar" />
    <div v-if="modal" class="modal-backdrop" @click.self="modal = ''" @keydown="trapFocus"><section class="modal" :class="{ 'wide-modal': modal === 'character' }" role="dialog" aria-modal="true" :aria-labelledby="'modal-title'">
      <div class="modal-header"><div><div class="eyebrow">{{ modal === 'character' ? 'CHARACTER' : modal === 'relation' ? 'RELATIONSHIP' : 'NOVEL ATLAS' }}</div><h2 id="modal-title">{{ modal === 'character' ? (isEditing ? '编辑角色档案' : '让新角色走进故事') : modal === 'relation' ? (isEditing ? '编辑人物关系' : '连接两个人的故事') : modal === 'import' ? '准备导入关系网' : modal === 'project' ? '关于这个故事' : modal === 'settings' ? '让图谱更合心意' : modal === 'confirm' ? confirmation?.title : '你好，故事的创作者' }}</h2></div><button class="icon-button" aria-label="关闭对话框" @click="modal = ''"><X :size="20" /></button></div>
      <form v-if="modal === 'character'" @submit.prevent="submitCharacter"><div class="avatar-editor"><button type="button" class="avatar avatar-upload" :style="{ '--character-color': draftCharacter.color }" @click="chooseAvatar"><img v-if="draftCharacter.avatar" :src="draftCharacter.avatar" alt="头像预览" /><ImagePlus v-else :size="27" /></button><div><button type="button" class="inline-button" @click="chooseAvatar">{{ draftCharacter.avatar ? '更换头像' : '上传角色头像' }}</button><p>PNG、JPG、WebP 或 GIF，不超过 5 MB</p><button v-if="draftCharacter.avatar" type="button" class="inline-button danger-subtle" @click="draftCharacter.avatar = ''">移除头像</button></div></div><div class="form-grid"><label>角色名称 <span>*</span><input v-model="draftCharacter.name" required maxlength="60" placeholder="这个角色叫什么？" /></label><label>所属阵营<input v-model="draftCharacter.group" list="group-options" maxlength="60" placeholder="例如：花家、云岫门" /><datalist id="group-options"><option v-for="g in groups" :key="g" :value="g" /></datalist></label></div><label>角色标签<input v-model="draftCharacter.tags" placeholder="例如：主角，剑客（用逗号分隔）" maxlength="200" /></label><div class="color-field"><span>角色颜色</span><button v-for="color in palette" :key="color" type="button" class="color-swatch" :style="{ background: color }" :aria-label="`角色颜色 ${color}`" :aria-pressed="draftCharacter.color === color" @click="draftCharacter.color = color"><Check v-if="draftCharacter.color === color" :size="14" /></button></div><label>人物小传<textarea v-model="draftCharacter.notes" rows="4" placeholder="性格、身世、愿望，还有未说出口的秘密…" maxlength="30000" /></label><details v-if="!isEditing && data.characters.length" class="initial-relation"><summary>同时添加一条初始关系 <span>可选</span></summary><div class="form-grid"><label>关联角色<select v-model="draftCharacter.initialTo"><option value="">暂不添加</option><option v-for="c in data.characters" :key="c.id" :value="c.id">{{ c.name }}</option></select></label><label>关系名称<input v-model="draftCharacter.initialLabel" maxlength="60" placeholder="新角色是对方的…" /></label></div><label>关系方向<select v-model="draftCharacter.initialDirection"><option value="one-way">新角色 → 所选角色</option><option value="two-way">新角色 ↔ 所选角色</option></select></label></details><p class="form-note">角色 ID：{{ draftCharacter.id }} · 唯一且不可修改</p><p v-if="formError" class="form-error" role="alert">{{ formError }}</p><div class="modal-actions"><button type="button" class="secondary-button" @click="modal = ''">取消</button><button type="submit" class="primary-button"><Check :size="15" />{{ isEditing ? '保存修改' : '添加角色' }}</button></div></form>
      <form v-else-if="modal === 'relation'" @submit.prevent="submitRelation"><div class="form-grid"><label>起点角色<select v-model="draftRelation.from" required><option value="" disabled>选择角色</option><option v-for="c in data.characters" :key="c.id" :value="c.id">{{ c.name }}</option></select></label><label>终点角色<select v-model="draftRelation.to" required><option value="" disabled>选择角色</option><option v-for="c in data.characters" :key="c.id" :value="c.id">{{ c.name }}</option></select></label></div><label>关系名称 <span>*</span><input v-model="draftRelation.label" required maxlength="60" placeholder="例如：母亲、朋友、师父" /></label><label>关系方向</label><div class="direction-options"><button type="button" :class="{ selected: draftRelation.direction === 'one-way' }" @click="draftRelation.direction = 'one-way'"><ArrowRight :size="21" /><strong>单向关系</strong><small>起点 → 终点</small></button><button type="button" :class="{ selected: draftRelation.direction === 'two-way' }" @click="draftRelation.direction = 'two-way'"><ArrowLeftRight :size="21" /><strong>双向关系</strong><small>起点 ↔ 终点</small></button></div><div class="relationship-preview">{{ name(draftRelation.from) }} {{ draftRelation.direction === 'two-way' ? '↔' : '→' }} {{ name(draftRelation.to) }}<span>{{ draftRelation.label || '关系名称' }}</span></div><label>关系描述<textarea v-model="draftRelation.description" rows="3" maxlength="30000" placeholder="他们之间，发生过怎样的故事？" /></label><p class="form-note">单向示例：花盈 → 花绫，标签“姐姐”，表示花盈是花绫的姐姐。</p><p v-if="formError" class="form-error" role="alert">{{ formError }}</p><div class="modal-actions"><button type="button" class="secondary-button" @click="modal = ''">取消</button><button type="submit" class="primary-button"><Link2 :size="15" />保存关系</button></div></form>
      <form v-else-if="modal === 'project'" @submit.prevent="submitProject"><label>故事名称<input v-model="draftProject.title" required maxlength="80" placeholder="给故事起个名字" /></label><label>一句话简介<textarea v-model="draftProject.description" rows="3" maxlength="300" placeholder="你想讲述一个怎样的故事？" /></label><p v-if="formError" class="form-error">{{ formError }}</p><div class="modal-actions"><button type="button" class="secondary-button" @click="modal = ''">取消</button><button type="submit" class="primary-button">保存故事信息</button></div></form>
      <div v-else-if="modal === 'import' && pendingImport"><div class="import-summary"><FolderOpen :size="30" /><h3>{{ pendingImport.data.title }}</h3><p>{{ pendingImport.data.characters.length }} 位角色 · {{ pendingImport.data.relations.length }} 条关系</p><span><Check :size="14" />角色 ID 和关系引用检查通过</span></div><p class="dialog-copy">导入将替换当前关系网。建议先导出当前故事备份；本次会话中可使用撤销恢复。</p><div v-if="pendingImport.warnings.length" class="import-warnings"><strong>有 {{ pendingImport.warnings.length }} 条头像提示</strong><p v-for="(warning, i) in pendingImport.warnings" :key="i">{{ warning }}</p></div><div class="modal-actions"><button class="secondary-button" @click="modal = ''">取消</button><button class="primary-button" @click="confirmImport"><Upload :size="15" />确认导入</button></div></div>
      <div v-else-if="modal === 'settings'"><div class="setting-row"><div><strong>显示关系标签</strong><p>在连线上显示人物之间的关系名称</p></div><button class="switch" :class="{ on: labels }" role="switch" :aria-checked="labels" aria-label="显示关系标签" @click="labels = !labels"><i></i></button></div><div class="setting-row"><div><strong>聚焦一度关系</strong><p>淡化与当前角色没有直接关联的内容</p></div><button class="switch" :class="{ on: neighborhood }" role="switch" :aria-checked="neighborhood" aria-label="聚焦一度关系" @click="neighborhood = !neighborhood"><i></i></button></div><label class="layout-setting">自动布局方式<select v-model="layout"><option value="fcose">自然分布 · fCoSE</option><option value="circle">环形分布 · Circle</option></select></label><p class="dialog-copy">自动布局会为角色留出间距。密集关系仍可能交叉，可放大查看或按阵营筛选。</p><div class="modal-actions"><button class="primary-button" @click="modal = ''">完成</button></div></div>
      <div v-else-if="modal === 'confirm' && confirmation"><p class="dialog-copy">{{ confirmation.description }}</p><div class="modal-actions"><button class="secondary-button" @click="modal = ''">取消</button><button :class="confirmation.destructive ? 'danger-button' : 'primary-button'" @click="confirmation.action">{{ confirmation.destructive ? '确认删除' : '新建故事' }}</button></div></div>
      <div v-else class="help-content"><p class="dialog-copy">知交，帮你把脑海中的人物与故事连接起来。所有内容仅保存在本机，随时可以导出 JSON 带走。</p><div class="help-step"><span>01</span><div><strong>让人物登场</strong><p>新增角色，写下姓名、小传和阵营，也可以选择头像。</p></div></div><div class="help-step"><span>02</span><div><strong>让故事相连</strong><p>添加单向或双向关系；同一对人物可以拥有多条关系。</p></div></div><div class="help-step"><span>03</span><div><strong>把全貌看清</strong><p>滚轮缩放，拖动画布，点击角色查看档案。利用阵营筛选与一度关系聚焦复杂网络。</p></div></div><div class="shortcut-row"><span>保存 <kbd>Ctrl S</kbd></span><span>撤销 <kbd>Ctrl Z</kbd></span><span>重做 <kbd>Ctrl Y</kbd></span></div><p class="form-note">桌面版支持 JSON 同目录内的相对头像路径（如 images/huaying.png），导出时自动嵌入图片。浏览器预览请上传头像或使用 data URL。</p><div class="modal-actions"><button class="primary-button" @click="modal = ''">开始创作</button></div></div>
    </section></div>
  </div>
</template>
