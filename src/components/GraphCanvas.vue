<script setup lang="ts">
import {
  Maximize,
  Minus,
  Network,
  Plus,
  Redo2,
  Undo2,
  Upload,
} from "lucide-vue-next";
import RelationshipGraph from "./RelationshipGraph.vue";
import { useWorkspaceContext } from "../workspaceContext";
const {
  toggleFullscreen,
  library,
  data,
  ready,
  group,
  labels,
  neighborhood,
  layout,
  layoutDensity,
  nodeSize,
  showAvatarNames,
  localPositions,
  rememberPositions,
  zoom,
  graph,
  undoStack,
  redoStack,
  theme,
  characters,
  selection,
  enterCharacter,
  leaveCharacter,
  undo,
  redo,
  select,
  editCharacter,
  importJson,
} = useWorkspaceContext();
</script>
<template>
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
      :story-id="library.activeId"
      :positions="localPositions"
      :node-size="nodeSize"
      :show-avatar-names="showAvatarNames"
      @positions="rememberPositions"
      :selected="selection"
      :group="group"
      :labels="labels"
      :neighborhood="neighborhood"
      :theme="theme"
      @hover="enterCharacter"
      @leave="leaveCharacter"
      :layout="layout"
      :density="layoutDensity"
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
        aria-label="全屏"
        title="全屏（Esc 或 F11 退出）"
        @click="toggleFullscreen"
      >
        <Maximize :size="16" />
      </button>
    </div>
  </div>
</template>
