<script setup lang="ts">
import { provideWorkspace } from "./workspaceContext";
const { inspector, jsonInput, readJson } = provideWorkspace();
import WorkspaceDialogs from "./components/WorkspaceDialogs.vue";
import AppHeader from "./components/AppHeader.vue";
import WorkspaceSidebar from "./components/WorkspaceSidebar.vue";
import GraphCanvas from "./components/GraphCanvas.vue";
import SelectionInspector from "./components/SelectionInspector.vue";
import WorkspaceStatus from "./components/WorkspaceStatus.vue";
import WorkspaceToast from "./components/WorkspaceToast.vue";
</script>
<template>
  <div class="app-shell">
    <AppHeader />
    <div class="workspace">
      <WorkspaceSidebar />

      <main class="main-area">
        <div class="graph-body">
          <GraphCanvas />
          <SelectionInspector v-if="inspector" />
        </div>
        <WorkspaceStatus />
      </main>
    </div>

    <WorkspaceToast />
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
