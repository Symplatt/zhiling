<script setup lang="ts">
import {
  ChevronDown,
  Link2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const {
  data,
  query,
  group,
  labels,
  graph,
  groups,
  characters,
  characterGroups,
  character,
  select,
  openModal,
  editCharacter,
  editRelation,
  editProject,
  palette,
} = useWorkspaceContext();
</script>
<template>
  <aside class="sidebar">
    <div class="project-card">
      <button
        class="project-title"
        title="切换关系网"
        @click="openModal('library')"
      >
        <span>{{ data.title }}</span>
      </button>
      <button
        class="icon-button project-rename"
        title="重命名关系网"
        aria-label="重命名关系网"
        @click="editProject"
      >
        <Pencil :size="15" />
      </button>
      <button
        class="project-switch icon-button"
        title="切换关系网"
        aria-label="切换关系网"
        @click="openModal('library')"
      >
        <ChevronDown :size="15" />
      </button>
    </div>
    <div class="sidebar-graph-actions" aria-label="关系网工具">
      <button class="toolbar-button" @click="graph?.arrange()">
        <Sparkles :size="15" />自动布局
      </button>
      <button
        class="toolbar-button"
        :class="{ toggled: labels }"
        :aria-pressed="labels"
        @click="labels = !labels"
      >
        <span class="text-icon">T</span>关系标签
      </button>
      <button
        class="toolbar-button"
        :disabled="!data.characters.length"
        @click="editRelation()"
      >
        <Link2 :size="15" />添加关系
      </button>
    </div>
    <div class="characters-panel">
      <div class="section-heading">
        <span>角色</span><span class="count">{{ data.characters.length }}</span
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
            ><img v-if="c.avatar" :src="c.avatar" alt="" /><span v-else>{{ c.name }}</span>
          </span>
          <span class="character-list-info">
            <strong>{{ c.name }}</strong>
            <small :title="characterGroups(c).join(' · ')">{{
              characterGroups(c).join(" · ") || "未分组"
            }}</small>
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
</template>
