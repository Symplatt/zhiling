<script setup lang="ts">
import { provideWorkspace } from "./workspaceContext";
const { fullscreen, inspector, jsonInput, readJson } = provideWorkspace();
import WorkspaceDialogs from "./components/WorkspaceDialogs.vue";
import AppHeader from "./components/AppHeader.vue";
import WorkspaceSidebar from "./components/WorkspaceSidebar.vue";
import GraphCanvas from "./components/GraphCanvas.vue";
import SelectionInspector from "./components/SelectionInspector.vue";
import WorkspaceStatus from "./components/WorkspaceStatus.vue";
import WorkspaceToast from "./components/WorkspaceToast.vue";
</script>
<template>
  <div class="app-shell" :class="{ 'graph-fullscreen': fullscreen }">
    <AppHeader v-show="!fullscreen" />
    <div class="workspace">
      <WorkspaceSidebar v-show="!fullscreen" />

      <main class="main-area">
        <div class="graph-body">
          <GraphCanvas />
          <SelectionInspector v-if="inspector && !fullscreen" />
        </div>
        <WorkspaceStatus v-show="!fullscreen" />
      </main>
    </div>

    <WorkspaceToast v-show="!fullscreen" />
    <input
      :ref="(element) => (jsonInput = element as HTMLInputElement | undefined)"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      aria-label="导入 JSON 文件"
      @change="readJson"
    />
    <WorkspaceDialogs />
  </div>
</template>

<style>
.graph-fullscreen .canvas-controls, .graph-fullscreen .canvas-caption, .graph-fullscreen .graph-empty { display: none; }
.graph-fullscreen.app-shell { height: 100dvh; border: 0; border-radius: 0; }
</style>
