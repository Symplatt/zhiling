<script setup lang="ts">
import ExportSettings from './ExportSettings.vue';
import { Check, Network } from "lucide-vue-next";
import { densityLevels } from "../layoutDensity";
import { useWorkspaceContext } from "../workspaceContext";
const {
  labels,
  neighborhood,
  layout,
  layoutDensity,
  nodeSize,
  modal,
  theme,
  themes,
  changeTheme,
} = useWorkspaceContext();
</script>
<template>
  <div class="settings-content">
    <div class="settings-options">
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
        <option value="fcose">自然分布</option>
        <option value="circle">环形分布</option>
      </select></label
    >
    <p class="dialog-copy">
      1 档排列最紧凑。已有手动布局可点击左侧“自动布局”重新排列；密集关系仍可能交叉。
    </p>
    <fieldset class="density-setting">
      <legend>排列稀疏程度</legend>
      <div class="density-levels">
        <label
          v-for="level in densityLevels"
          :key="level"
          :class="{ selected: layoutDensity === level }"
        >
          <input
            v-model="layoutDensity"
            type="radio"
            name="layout-density"
            :value="level"
            :aria-label="`排列稀疏程度 ${level} 档`"
          />
          <strong>{{ level }} 档</strong>
        </label>
      </div>
    </fieldset>
    <fieldset class="density-setting">
      <legend>角色头像大小</legend>
      <div class="density-levels">
        <label v-for="level in densityLevels" :key="level" :class="{ selected: nodeSize === level }">
          <input v-model="nodeSize" type="radio" name="node-size" :value="level" :aria-label="`角色头像大小 ${level} 档`" />
          <strong>{{ level }} 档</strong>
        </label>
      </div>
    </fieldset>
    <ExportSettings />
    </div>
    <div class="modal-actions">
      <button class="primary-button" @click="modal = ''">完成</button>
    </div>
  </div>
</template>
<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.settings-options {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 3px 5px;
}
.modal-actions {
  flex-shrink: 0;
  margin-top: 16px;
  padding-top: 16px;
}
.density-setting {
  border: 0;
  padding: 0;
  margin: 20px 0 0;
  min-width: 0;
}
.density-setting legend {
  font-size: 13px;
  color: var(--text);
  margin-bottom: 10px;
}
.density-levels {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}
.density-levels label {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  background: var(--paper);
  color: var(--muted);
}
.density-levels label.selected {
  color: var(--green);
  border-color: var(--green);
  background: var(--soft);
}
.density-levels label:focus-within {
  outline: 2px solid var(--green);
  outline-offset: 3px;
}
.density-levels input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.density-levels strong {
  font-size: 13px;
}
.density-levels small {
  font-size: 11px;
}
</style>
