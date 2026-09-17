<script setup lang="ts">
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDot,
  CircleHelp,
  Download,
  Focus,
  FolderOpen,
  Image,
  Link2,
  Maximize,
  Minus,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Redo2,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Users,
  X,
} from "lucide-vue-next";
import RelationshipGraph from "./components/RelationshipGraph.vue";
import { useWorkspace } from "./useWorkspace";
const {
  library,
  data,
  ready,
  recoveryBlocked,
  saveStatus,
  storageLabel,
  query,
  group,
  selectedId,
  selectedKind,
  labels,
  neighborhood,
  layout,
  inspector,
  zoom,
  graph,
  modal,
  formError,
  toast,
  toastError,
  jsonInput,
  draftCharacter,
  draftRelation,
  draftProject,
  creatingProject,
  bookQuery,
  books,
  isEditing,
  pendingImport,
  undoStack,
  redoStack,
  confirmation,
  theme,
  themes,
  groups,
  characters,
  character,
  relation,
  linked,
  selection,
  connectedPeople,
  name,
  relationLabel,
  relationFrom,
  hoverId,
  floatingId,
  pinnedId,
  floatQuery,
  floatingCharacter,
  floatingRows,
  enterCharacter,
  leaveCharacter,
  holdFloating,
  releaseFloating,
  pinCharacter,
  closeFloating,
  persist,
  undo,
  redo,
  select,
  openModal,
  editCharacter,
  submitCharacter,
  editRelation,
  submitRelation,
  deleteCharacter,
  deleteRelation,
  activate,
  newProject,
  editProject,
  submitProject,
  deleteStory,
  changeTheme,
  importJson,
  readJson,
  confirmImport,
  exportJson,
  exportImage,
  exporting,
  trapFocus,
  palette,
} = useWorkspace();
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <div class="brand-mark"><Network :size="22" /></div>
        <strong>织灵</strong><span class="brand-divider"></span
        ><span class="brand-caption">角色关系网</span>
      </div>

      <div class="header-actions">
        <button class="text-button" @click="importJson">
          <Upload :size="15" />导入(Json)</button
        ><button class="text-button" @click="exportJson(false)">
          <Download :size="15" />导出(Json)</button
        ><button
          class="text-button"
          :disabled="exporting || !data.characters.length"
          @click="exportImage"
        >
          <Image :size="15" />{{
            exporting ? "导出中…" : "导出图片(png)"
          }}</button
        ><span class="vertical-divider"></span
        ><button class="save-button" @click="persist(true).catch(() => {})">
          <Save :size="14" />保存</button
        ><button
          class="icon-button"
          title="使用帮助"
          aria-label="使用帮助"
          @click="openModal('help')"
        >
          <CircleHelp :size="18" />
        </button>
      </div>
    </header>
    <div class="workspace">
      <aside class="sidebar">
        <div class="project-card">
          <button
            class="project-title"
            title="切换关系网"
            @click="openModal('library')"
          >
            <span>{{ data.title }}</span
            ><ChevronDown :size="15" />
          </button>
        </div>
        <div class="characters-panel">
          <div class="section-heading">
            <span>角色</span
            ><span class="count">{{ data.characters.length }}</span
            ><button
              class="icon-button small"
              aria-label="添加角色"
              title="添加角色"
              @click="editCharacter()"
            >
              <Plus :size="17" />
            </button>
          </div>
          <div class="search-box">
            <Search :size="15" /><input
              v-model="query"
              placeholder="搜索角色、标签…"
              aria-label="搜索角色"
            /><kbd v-if="!query">⌕</kbd
            ><button
              v-else
              class="clear-search"
              aria-label="清除搜索"
              @click="query = ''"
            >
              <X :size="13" />
            </button>
          </div>
          <div class="filter-row">
            <span>{{ group || "全部角色" }}</span
            ><select v-model="group" aria-label="按阵营筛选">
              <option value="">全部阵营</option>
              <option v-for="g in groups" :key="g">{{ g }}</option>
            </select>
          </div>
          <div class="character-list">
            <button
              v-for="c in characters"
              :key="c.id"
              class="character-item"
              :class="{ active: character?.id === c.id }"
              @click="select('character', c.id, true)"
            >
              <span
                class="avatar small-avatar"
                :style="{ '--character-color': c.color || palette[0] }"
                ><span>{{ c.name }}</span>
              </span>
              <span class="character-list-info">
                <strong>{{ c.name }}</strong>
                <small>{{ c.group || "未分组" }}</small>
              </span>
            </button>
            <div v-if="!characters.length" class="list-empty">
              <Search :size="22" />
              <p>
                {{
                  data.characters.length
                    ? "没有找到匹配的角色"
                    : "你的故事，等待第一位角色"
                }}
              </p>
              <button
                v-if="data.characters.length"
                class="inline-button"
                @click="
                  query = '';
                  group = '';
                "
              >
                清除筛选
              </button>
            </div>
          </div>
          <button class="add-character" @click="editCharacter()">
            <Plus :size="16" />添加角色
          </button>
        </div>
      </aside>

      <main class="main-area">
        <!-- <section class="graph-header">
          <div>
            <div class="breadcrumb">
              <button class="inline-button" @click="editProject">
                {{ data.title }} <Pencil :size="11" /></button
              ><ChevronRight :size="12" /><span>人物关系图</span>
            </div>
            <h1>故事里的人，<span>彼此相连。</span></h1>
            <p>{{ data.description || "让错综复杂的关系，变得一目了然。" }}</p>
          </div>
          <button class="primary-button" @click="editCharacter()">
            <Plus :size="17" />新增角色
          </button>
        </section> -->
        <div class="graph-toolbar">
          <button class="toolbar-button" @click="graph?.arrange()">
            <Sparkles :size="15" />自动布局</button
          ><button
            class="toolbar-button"
            :class="{ toggled: labels }"
            :aria-pressed="labels"
            @click="labels = !labels"
          >
            <span class="text-icon">T</span>关系标签
          </button>
          <div class="toolbar-spacer"></div>
          <button
            class="toolbar-button"
            :disabled="!data.characters.length"
            @click="editRelation()"
          >
            <Link2 :size="15" />添加关系</button
          ><button
            class="icon-button"
            title="图谱设置"
            aria-label="图谱设置"
            @click="openModal('settings')"
          >
            <SlidersHorizontal :size="16" /></button
          ><button
            class="icon-button panel-toggle"
            :title="inspector ? '收起详情' : '展开详情'"
            :aria-label="inspector ? '收起详情' : '展开详情'"
            @click="inspector = !inspector"
          >
            <PanelRightClose v-if="inspector" :size="17" /><PanelRightOpen
              v-else
              :size="17"
            />
          </button>
        </div>
        <div class="graph-body">
          <div class="canvas-wrap">
            <div class="canvas-caption">
              <span class="local-dot"></span>{{ group || "全部人物"
              }}<span>
                /
                {{ group ? characters.length : data.characters.length }}
                位角色</span
              >
            </div>
            <RelationshipGraph
              v-if="ready"
              :key="library.activeId"
              ref="graph"
              :data="data"
              :selected="selection"
              :group="group"
              :labels="labels"
              :neighborhood="neighborhood"
              :theme="theme"
              @hover="enterCharacter"
              @leave="leaveCharacter"
              :layout="layout"
              @select="select"
              @zoom="zoom = $event"
            />
            <div v-if="ready && !data.characters.length" class="graph-empty">
              <div class="empty-network">
                <Network :size="42" :stroke-width="1.2" />
              </div>
              <h2>一段故事，从相遇开始</h2>
              <p>添加第一位角色，或导入已有的关系网。</p>
              <button class="primary-button" @click="editCharacter()">
                <Plus :size="16" />创建第一个角色</button
              ><button class="text-button" @click="importJson">
                <Upload :size="15" />导入 JSON 文件
              </button>
            </div>
            <div class="canvas-controls">
              <button
                class="icon-button"
                aria-label="撤销"
                title="撤销 Ctrl+Z"
                :disabled="!undoStack.length"
                @click="undo"
              >
                <Undo2 :size="16" /></button
              ><button
                class="icon-button"
                aria-label="重做"
                title="重做 Ctrl+Y"
                :disabled="!redoStack.length"
                @click="redo"
              >
                <Redo2 :size="16" /></button
              ><span class="vertical-divider"></span
              ><button
                class="icon-button"
                aria-label="缩小"
                @click="graph?.zoomBy(0.8)"
              >
                <Minus :size="16" /></button
              ><span class="zoom-value">{{ zoom }}%</span
              ><button
                class="icon-button"
                aria-label="放大"
                @click="graph?.zoomBy(1.25)"
              >
                <Plus :size="16" /></button
              ><span class="vertical-divider"></span
              ><button
                class="icon-button"
                aria-label="适应画布"
                title="适应画布"
                @click="graph?.fit()"
              >
                <Maximize :size="16" />
              </button>
            </div>
          </div>
          <aside v-if="inspector" class="inspector">
            <div class="inspector-header">
              <span>{{ relation ? "关系详情" : "角色档案" }}</span
              ><button
                class="icon-button small"
                aria-label="关闭详情"
                @click="inspector = false"
              >
                <X :size="15" />
              </button>
            </div>
            <template v-if="character">
              <div class="profile">
                <span
                  class="avatar profile-avatar"
                  :style="{
                    '--character-color': character.color || palette[0],
                  }"
                  ><span>{{ character.name }}</span
                  ><i></i
                ></span>
                <h2>{{ character.name }}</h2>

                <div class="tags">
                  <span v-for="tag in character.tags" :key="tag">{{
                    tag
                  }}</span>
                </div>
                <button class="edit-profile" @click="editCharacter(character)">
                  <Pencil :size="13" />编辑档案
                </button>
              </div>
              <div class="profile-stats">
                <div>
                  <strong>{{ connectedPeople }}</strong
                  ><span>关联人物</span>
                </div>
                <span></span>
                <div>
                  <strong>{{ linked.length }}</strong
                  ><span>人物关系</span>
                </div>
              </div>
              <!-- <section class="inspector-section">
                <h3><BookOpen :size="14" />人物小传</h3>
                <p class="biography">
                  {{
                    character.notes ||
                    "还没有小传。编辑档案，记下这个角色的故事。"
                  }}
                </p>
              </section> -->
              <section class="inspector-section relation-section">
                <h3>
                  <Link2 :size="14" />人物关系<span class="count">{{
                    linked.length
                  }}</span
                  ><button
                    class="icon-button small"
                    aria-label="为当前角色添加关系"
                    @click="editRelation()"
                  >
                    <Plus :size="15" />
                  </button>
                </h3>
                <div v-if="!linked.length" class="subtle-empty">
                  尚未与其他角色建立关系
                </div>
                <button
                  v-for="r in linked"
                  :key="r.id"
                  class="relation-row"
                  @click="select('relation', r.id)"
                >
                  <span class="relation-direction"
                    ><ArrowLeftRight
                      v-if="r.direction === 'two-way'"
                      :size="15" /><ArrowRight
                      v-else
                      :size="15"
                      :class="{ reversed: r.to === character.id }" /></span
                  ><span
                    ><strong>{{
                      name(r.from === character.id ? r.to : r.from)
                    }}</strong
                    ><small
                      >{{ r.from === character.id ? "我" : name(r.from) }}
                      {{ r.direction === "two-way" ? "↔" : "→" }}
                      {{ r.to === character.id ? "我" : name(r.to) }}</small
                    ></span
                  ><span class="relation-pill">{{ relationLabel(r) }}</span
                  ><ChevronRight :size="12" />
                </button>
              </section>
              <div class="inspector-foot">
                <button
                  class="text-button"
                  :class="{ 'focus-active': neighborhood }"
                  @click="neighborhood = !neighborhood"
                >
                  <Focus :size="15" />{{
                    neighborhood ? "显示全部关系" : "聚焦一度关系"
                  }}</button
                ><button
                  class="icon-button danger-subtle"
                  aria-label="删除当前角色"
                  title="删除角色"
                  @click="deleteCharacter(character)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </template>
            <template v-else-if="relation"
              ><div class="relation-profile">
                <div class="relation-symbol"><Link2 :size="26" /></div>
                <h2>{{ relationLabel(relation) }}</h2>
                <p>
                  {{
                    relation.direction === "two-way" ? "双向关系" : "单向关系"
                  }}
                </p>
                <div class="endpoints">
                  <button @click="select('character', relation.from, true)">
                    {{ name(relation.from) }}</button
                  ><ArrowLeftRight
                    v-if="relation.direction === 'two-way'"
                    :size="20"
                  /><ArrowRight v-else :size="20" /><button
                    @click="select('character', relation.to, true)"
                  >
                    {{ name(relation.to) }}
                  </button>
                </div>
                <button class="edit-profile" @click="editRelation(relation)">
                  <Pencil :size="13" />编辑关系
                </button>
              </div>
              <section class="inspector-section">
                <h3><BookOpen :size="14" />关系描述</h3>
                <p class="biography">
                  {{
                    relation.description ||
                    "还没有补充描述。记录他们相识的缘由，或关系变化的伏笔。"
                  }}
                </p>
              </section>
              <div class="inspector-foot">
                <span class="muted-text">每条连线，都是故事。</span
                ><button
                  class="icon-button danger-subtle"
                  aria-label="删除当前关系"
                  @click="deleteRelation(relation)"
                >
                  <Trash2 :size="14" />
                </button></div
            ></template>
            <div v-else class="no-selection">
              <CircleDot :size="36" :stroke-width="1" />
              <h3>走近故事中的人</h3>
              <p>点击一个角色或一条连线，<br />在这里查看和编辑详情。</p>
            </div>
          </aside>
        </div>
        <footer class="status-bar">
          <span><Users :size="13" />{{ data.characters.length }} 位角色</span
          ><span><Link2 :size="13" />{{ data.relations.length }} 条关系</span>
          <div class="toolbar-spacer"></div>
          <span
            :class="{
              'error-text': saveStatus === '保存失败' || recoveryBlocked,
            }"
            ><CheckCheck
              v-if="saveStatus === '已自动保存'"
              :size="14"
            /><AlertCircle v-else :size="14" />{{ saveStatus }}</span
          ><span class="local-badge">{{ storageLabel }}</span>
        </footer>
      </main>
    </div>

    <!-- <Teleport to="body">
      <aside
        v-if="floatingCharacter && !modal"
        class="floating-relations"
        role="region"
        aria-label="悬浮关系窗口"
        @mouseenter="holdFloating"
        @mouseleave="releaseFloating"
      >
        <header>
          <div>
            <span class="eyebrow">{{
              pinnedId ? "已固定 · 人物关系" : "悬停预览 · 人物关系"
            }}</span>
            <h2>
              {{ floatingCharacter.name
              }}<small>与其余 {{ data.characters.length - 1 }} 位角色</small>
            </h2>
          </div>
          <button
            class="icon-button"
            :aria-label="pinnedId ? '取消固定关系窗口' : '固定当前关系窗口'"
            @click="pinCharacter(floatingCharacter.id)"
          >
            <PinOff v-if="pinnedId" :size="16" /><Pin
              v-else
              :size="16"
            /></button
          ><button
            class="icon-button"
            aria-label="关闭悬浮关系窗口"
            @click="closeFloating"
          >
            <X :size="17" />
          </button>
        </header>
        <div class="search-box">
          <Search :size="14" /><input
            v-model="floatQuery"
            placeholder="查找其他角色…"
            aria-label="搜索悬浮窗口角色"
          />
        </div>
        <div class="floating-rows">
          <div
            v-for="row in floatingRows"
            :key="row.character.id"
            class="floating-row"
          >
            <strong>{{ row.character.name }}</strong>
            <div>
              <template v-if="row.relations.length"
                ><p
                  v-for="r in row.relations"
                  :key="r.id"
                  :title="r.description"
                >
                  <span>{{ relationFrom(r, floatingCharacter.id) }}</span
                  ><small v-if="r.description">{{ r.description }}</small>
                </p></template
              ><span v-else class="no-relation">暂无直接关系</span>
            </div>
          </div>
          <p v-if="!floatingRows.length" class="subtle-empty">
            {{
              data.characters.length === 1 ? "还没有其他角色" : "没有匹配的角色"
            }}
          </p>
        </div>
        <footer>
          {{
            pinnedId
              ? "已固定，移开鼠标也会保留。"
              : "点击窗口右上角的图钉，可固定此窗口。"
          }}
        </footer>
      </aside>
    </Teleport> -->
    <Transition name="toast"
      ><div
        v-if="toast"
        class="toast-message"
        :class="{ error: toastError }"
        role="status"
      >
        <AlertCircle v-if="toastError" :size="18" /><Check
          v-else
          :size="18"
        /><span>{{ toast }}</span
        ><button
          class="icon-button small"
          aria-label="关闭提示"
          @click="toast = ''"
        >
          <X :size="14" />
        </button></div
    ></Transition>
    <input
      ref="jsonInput"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      aria-label="导入 JSON 文件"
      @change="readJson"
    />
    <Teleport to="body"
      ><div
        v-if="modal"
        class="modal-backdrop"
        @click.self="modal = ''"
        @keydown="trapFocus"
      >
        <section
          class="modal"
          :class="{
            'wide-modal': modal === 'character' || modal === 'library',
          }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'modal-title'"
        >
          <div class="modal-header">
            <div>
              <div class="eyebrow">
                {{
                  modal === "character"
                    ? "CHARACTER"
                    : modal === "relation"
                      ? "RELATIONSHIP"
                      : "NOVEL ATLAS"
                }}
              </div>
              <h2 id="modal-title">
                {{
                  modal === "character"
                    ? isEditing
                      ? "编辑角色档案"
                      : "让新角色走进故事"
                    : modal === "relation"
                      ? isEditing
                        ? "编辑人物关系"
                        : "连接两个人的故事"
                      : modal === "import"
                        ? "准备导入关系网"
                        : modal === "project"
                          ? creatingProject
                            ? "创建新的关系网"
                            : "编辑关系网信息"
                          : modal === "library"
                            ? "关系网列表"
                            : modal === "settings"
                              ? "让图谱更合心意"
                              : modal === "confirm"
                                ? confirmation?.title
                                : "你好，故事的创作者"
                }}
              </h2>
            </div>
            <button
              class="icon-button"
              aria-label="关闭对话框"
              @click="modal = ''"
            >
              <X :size="20" />
            </button>
          </div>
          <form v-if="modal === 'character'" @submit.prevent="submitCharacter">
            <div class="form-grid">
              <label
                >角色名称 <span>*</span
                ><input
                  v-model="draftCharacter.name"
                  required
                  maxlength="60"
                  placeholder="这个角色叫什么？" /></label
              ><label
                >所属阵营<input
                  v-model="draftCharacter.group"
                  list="group-options"
                  maxlength="60"
                  placeholder="例如：花家、云岫门" /><datalist
                  id="group-options"
                >
                  <option v-for="g in groups" :key="g" :value="g" /></datalist
              ></label>
            </div>
            <label
              >角色标签<input
                v-model="draftCharacter.tags"
                placeholder="侠客 仙子 金丹后期（用空格分隔标签）"
                maxlength="200"
            /></label>
            <div class="color-field">
              <span>角色颜色</span
              ><button
                v-for="color in palette"
                :key="color"
                type="button"
                class="color-swatch"
                :style="{ background: color }"
                :aria-label="`角色颜色 ${color}`"
                :aria-pressed="draftCharacter.color === color"
                @click="draftCharacter.color = color"
              >
                <Check v-if="draftCharacter.color === color" :size="14" />
              </button>
            </div>
            <!-- <label
              >人物小传<textarea
                v-model="draftCharacter.notes"
                rows="4"
                placeholder="性格、身世、愿望，还有未说出口的秘密…"
                maxlength="30000"
              />
            </label> -->
            <details
              v-if="!isEditing && data.characters.length"
              class="initial-relation"
            >
              <summary>同时添加一条初始关系 <span>可选</span></summary>
              <div class="form-grid">
                <label
                  >关联角色<select v-model="draftCharacter.initialTo">
                    <option value="">暂不添加</option>
                    <option
                      v-for="c in data.characters"
                      :key="c.id"
                      :value="c.id"
                    >
                      {{ c.name }}
                    </option>
                  </select></label
                ><label
                  >关系名称<input
                    v-model="draftCharacter.initialLabel"
                    maxlength="60"
                    placeholder="新角色是对方的…"
                /></label>
              </div>
              <label
                >关系方向<select v-model="draftCharacter.initialDirection">
                  <option value="one-way">新角色 → 所选角色</option>
                  <option value="two-way">新角色 ↔ 所选角色</option>
                </select></label
              ><template v-if="draftCharacter.initialDirection === 'two-way'"
                ><label
                  >双向关系方式<select v-model="draftCharacter.initialMode">
                    <option value="shared">共同关系（例如：母女）</option>
                    <option value="paired">分别填写（例如：母亲/女儿）</option>
                  </select></label
                ><label v-if="draftCharacter.initialMode === 'paired'"
                  >对方对新角色的关系<input
                    v-model="draftCharacter.initialReverse"
                    placeholder="例如：女儿"
                    maxlength="60" /></label
              ></template>
            </details>
            <p class="form-note">
              角色 ID：{{ draftCharacter.id }} · 唯一且不可修改
            </p>
            <p v-if="formError" class="form-error" role="alert">
              {{ formError }}
            </p>
            <div class="modal-actions">
              <button
                type="button"
                class="secondary-button"
                @click="modal = ''"
              >
                取消</button
              ><button type="submit" class="primary-button">
                <Check :size="15" />{{ isEditing ? "保存修改" : "添加角色" }}
              </button>
            </div>
          </form>
          <form
            v-else-if="modal === 'relation'"
            @submit.prevent="submitRelation"
          >
            <div class="form-grid">
              <label
                >起点角色（A）<select v-model="draftRelation.from" required>
                  <option value="" disabled>选择角色</option>
                  <option
                    v-for="c in data.characters"
                    :key="c.id"
                    :value="c.id"
                  >
                    {{ c.name }}
                  </option>
                </select></label
              ><label
                >终点角色（B）<select v-model="draftRelation.to" required>
                  <option value="" disabled>选择角色</option>
                  <option
                    v-for="c in data.characters"
                    :key="c.id"
                    :value="c.id"
                  >
                    {{ c.name }}
                  </option>
                </select></label
              >
            </div>
            <label>关系方向</label>
            <div class="direction-options">
              <button
                type="button"
                :class="{ selected: draftRelation.direction === 'one-way' }"
                @click="draftRelation.direction = 'one-way'"
              >
                <ArrowRight :size="21" /><strong>单向关系</strong
                ><small>起点 → 终点</small></button
              ><button
                type="button"
                :class="{ selected: draftRelation.direction === 'two-way' }"
                @click="draftRelation.direction = 'two-way'"
              >
                <ArrowLeftRight :size="21" /><strong>双向关系</strong
                ><small>起点 ↔ 终点</small>
              </button>
            </div>
            <div
              v-if="draftRelation.direction === 'two-way'"
              class="relation-modes"
            >
              <button
                type="button"
                :class="{ selected: draftRelation.mode === 'shared' }"
                @click="draftRelation.mode = 'shared'"
              >
                共同关系</button
              ><button
                type="button"
                :class="{ selected: draftRelation.mode === 'paired' }"
                @click="draftRelation.mode = 'paired'"
              >
                区别双方
              </button>
            </div>
            <div
              v-if="
                draftRelation.direction === 'two-way' &&
                draftRelation.mode === 'paired'
              "
              class="form-grid"
            >
              <label
                >A 对 B 的关系<input
                  v-model="draftRelation.label"
                  required
                  maxlength="60"
                  placeholder="例如：母亲" /></label
              ><label
                >B 对 A 的关系<input
                  v-model="draftRelation.reverseLabel"
                  required
                  maxlength="60"
                  placeholder="例如：女儿"
              /></label>
            </div>
            <label v-else
              >{{
                draftRelation.direction === "two-way" ? "共同关系" : "关系名称"
              }}<input
                v-model="draftRelation.label"
                required
                maxlength="60"
                :placeholder="
                  draftRelation.direction === 'two-way'
                    ? '例如：母女、朋友'
                    : '例如：母亲、师父'
                "
            /></label>
            <div class="relationship-preview">
              {{ name(draftRelation.from) }}
              {{ draftRelation.direction === "two-way" ? "↔" : "→" }}
              {{ name(draftRelation.to)
              }}<span>{{ relationLabel(draftRelation) || "关系名称" }}</span>
            </div>
            <label
              >关系描述<textarea
                v-model="draftRelation.description"
                rows="3"
                maxlength="30000"
                placeholder="他们之间，发生过怎样的故事？"
              />
            </label>
            <p class="form-note">
              单向示例：甲 → 乙，标签“姐姐”，表示甲是乙的姐姐。
            </p>
            <p v-if="formError" class="form-error" role="alert">
              {{ formError }}
            </p>
            <div class="modal-actions">
              <button
                type="button"
                class="secondary-button"
                @click="modal = ''"
              >
                取消</button
              ><button type="submit" class="primary-button">
                <Link2 :size="15" />保存关系
              </button>
            </div>
          </form>
          <form v-else-if="modal === 'project'" @submit.prevent="submitProject">
            <label
              >关系网名称<input
                v-model="draftProject.title"
                required
                maxlength="80"
                placeholder="给故事起个名字"
            /></label>
            <p v-if="formError" class="form-error">{{ formError }}</p>
            <div class="modal-actions">
              <button
                type="button"
                class="secondary-button"
                @click="modal = ''"
              >
                取消</button
              ><button type="submit" class="primary-button">
                {{ creatingProject ? "创建关系网" : "保存信息" }}
              </button>
            </div>
          </form>
          <div v-else-if="modal === 'import' && pendingImport">
            <div class="import-summary">
              <FolderOpen :size="30" />
              <h3>
                {{
                  pendingImport.library
                    ? "完整书架 · " +
                      pendingImport.library.graphs.length +
                      " 张关系网"
                    : pendingImport.data.title
                }}
              </h3>
              <p>
                {{ pendingImport.data.characters.length }} 位角色 ·
                {{ pendingImport.data.relations.length }} 条关系
              </p>
              <span><Check :size="14" />角色 ID 和关系引用检查通过</span>
            </div>
            <div v-if="pendingImport.warnings.length" class="import-warnings">
              <strong>有 {{ pendingImport.warnings.length }} 条提示</strong>
              <p v-for="(warning, i) in pendingImport.warnings" :key="i">
                {{ warning }}
              </p>
            </div>
            <div class="modal-actions">
              <button class="secondary-button" @click="modal = ''">取消</button
              ><button class="primary-button" @click="confirmImport">
                <Upload :size="15" />确认导入
              </button>
            </div>
          </div>
          <div v-else-if="modal === 'settings'">
            <div class="theme-grid">
              <button
                v-for="item in themes"
                :key="item.id"
                class="theme-card"
                :class="{ selected: theme === item.id }"
                :aria-pressed="theme === item.id"
                @click="changeTheme(item.id)"
              >
                <span
                  class="theme-swatch"
                  :style="{ background: item.background, color: item.color }"
                  ><Network :size="22" /><Check
                    v-if="theme === item.id"
                    :size="12" /></span
                ><strong>{{ item.name }}</strong
                ><small>{{ item.description }}</small>
              </button>
            </div>
            <div class="setting-row">
              <div>
                <strong>显示关系标签</strong>
                <p>在连线上显示人物之间的关系名称</p>
              </div>
              <button
                class="switch"
                :class="{ on: labels }"
                role="switch"
                :aria-checked="labels"
                aria-label="显示关系标签"
                @click="labels = !labels"
              >
                <i></i>
              </button>
            </div>
            <div class="setting-row">
              <div>
                <strong>聚焦一度关系</strong>
                <p>淡化与当前角色没有直接关联的内容</p>
              </div>
              <button
                class="switch"
                :class="{ on: neighborhood }"
                role="switch"
                :aria-checked="neighborhood"
                aria-label="聚焦一度关系"
                @click="neighborhood = !neighborhood"
              >
                <i></i>
              </button>
            </div>
            <label class="layout-setting"
              >自动布局方式<select v-model="layout">
                <option value="fcose">自然分布 · fCoSE</option>
                <option value="circle">环形分布 · Circle</option>
              </select></label
            >
            <p class="dialog-copy">
              自动布局会为角色留出间距。密集关系仍可能交叉，可放大查看或按阵营筛选。
            </p>
            <div class="modal-actions">
              <button class="primary-button" @click="modal = ''">完成</button>
            </div>
          </div>
          <div v-else-if="modal === 'library'">
            <div class="book-tools">
              <div class="search-box">
                <Search :size="15" />
                <input
                  v-model="bookQuery"
                  placeholder="搜索关系网…"
                  aria-label="搜索关系网"
                />
              </div>
              <button class="primary-button" @click="newProject">
                <Plus :size="15" />
              </button>
            </div>
            <p class="form-note">
              已有关系网： {{ library.graphs.length }} /
              1,000；每张关系网独立编辑和保存。
            </p>
            <div class="book-list">
              <div
                v-for="entry in books"
                :key="entry.id"
                class="book-row"
                :class="{ active: entry.id === library.activeId }"
              >
                <button class="book-open" @click="activate(entry.id)">
                  <Network :size="22" /><span
                    ><strong>{{ entry.data.title }}</strong
                    ><small
                      >{{ entry.data.characters.length }} 位角色 ·
                      {{ entry.data.relations.length }} 条关系</small
                    ></span
                  ><Check
                    v-if="entry.id === library.activeId"
                    :size="16"
                  /></button
                ><button
                  class="icon-button danger-subtle"
                  :aria-label="'删除关系网' + entry.data.title"
                  @click="deleteStory(entry.id)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
              <p v-if="!books.length" class="subtle-empty">
                没有找到匹配的关系网
              </p>
            </div>
            <div class="modal-actions">
              <button class="secondary-button" @click="exportJson(true)">
                <Download :size="15" />备份整个书架</button
              ><button class="primary-button" @click="modal = ''">完成</button>
            </div>
          </div>
          <div v-else-if="modal === 'confirm' && confirmation">
            <p class="dialog-copy">{{ confirmation.description }}</p>
            <div class="modal-actions">
              <button class="secondary-button" @click="modal = ''">取消</button
              ><button
                :class="
                  confirmation.destructive ? 'danger-button' : 'primary-button'
                "
                @click="confirmation.action"
              >
                {{ confirmation.destructive ? "确认删除" : "新建故事" }}
              </button>
            </div>
          </div>
          <div v-else class="help-content">
            <p class="dialog-copy">
              织灵，帮你把脑海中的人物与故事连接起来。所有内容仅保存在本机，随时可以导出
              JSON 带走。
            </p>
            <div class="help-step">
              <span>01</span>
              <div>
                <strong>让人物登场</strong>
                <p>新增角色，写下姓名、小传和阵营，用空格分隔标签。</p>
              </div>
            </div>
            <div class="help-step">
              <span>02</span>
              <div>
                <strong>让故事相连</strong>
                <p>添加单向或双向关系；同一对人物可以拥有多条关系。</p>
              </div>
            </div>
            <div class="help-step">
              <span>03</span>
              <div>
                <strong>把全貌看清</strong>
                <p>
                  滚轮缩放，拖动画布，点击角色查看档案。利用阵营筛选与一度关系聚焦复杂网络。
                </p>
              </div>
            </div>
            <div class="shortcut-row">
              <span>保存 <kbd>Ctrl S</kbd></span
              ><span>撤销 <kbd>Ctrl Z</kbd></span
              ><span>重做 <kbd>Ctrl Y</kbd></span>
            </div>
            <p class="form-note">
              从左侧打开关系网书架，可独立保存 1,000
              张关系网。悬停角色可查看所有关系；点击悬浮窗口右上角图钉可固定窗口。导出图片始终包含整张关系网。
            </p>
            <div class="modal-actions">
              <button class="primary-button" @click="modal = ''">
                开始创作
              </button>
            </div>
          </div>
        </section>
      </div></Teleport
    >
  </div>
</template>
