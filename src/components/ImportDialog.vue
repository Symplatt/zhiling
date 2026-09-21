<script setup lang="ts">
import { Check, FolderOpen, Upload } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const { modal, pendingImport, confirmImport } =
  useWorkspaceContext();
</script>
<template>
  <div v-if="pendingImport">
    <div class="import-summary">
      <FolderOpen :size="30" />
      <h3>
        {{
          pendingImport.library
            ? "完整书架 · " + pendingImport.library.graphs.length + " 张关系网"
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
</template>
