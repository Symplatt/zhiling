<script setup lang="ts">
import {
  CircleHelp,
  Download,
  Image,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Save,
  SlidersHorizontal,
  Upload,
} from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const {
  data,
  inspector,
  persist,
  openModal,
  importJson,
  exportJson,
  exportImage,
  exporting,
} = useWorkspaceContext();
</script>
<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark"><Network :size="22" /></div>
      <strong>织灵</strong><span class="brand-divider"></span
      ><span class="brand-caption">角色关系网</span>
    </div>

    <div class="header-actions">
      <button class="text-button" @click="importJson">
        <Download :size="15" />导入(Json)</button
      ><button class="text-button" @click="exportJson(false)">
        <Upload :size="15" />导出(Json)</button
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
      <button
        class="icon-button"
        title="图谱设置"
        aria-label="图谱设置"
        @click="openModal('settings')"
      >
        <SlidersHorizontal :size="16" />
      </button>
      <button
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
  </header>
</template>
