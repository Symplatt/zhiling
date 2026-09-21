<script setup lang="ts">
import { AlertCircle, CheckCheck, Link2, Users } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const { data, recoveryBlocked, displaySaveStatus: saveStatus, storageLabel } =
  useWorkspaceContext();
</script>
<template>
  <footer class="status-bar">
    <span><Users :size="13" />{{ data.characters.length }} 位角色</span
    ><span><Link2 :size="13" />{{ data.relations.length }} 条关系</span>
    <div class="toolbar-spacer"></div>
    <span
      :class="{
        'error-text': saveStatus === '保存失败' || recoveryBlocked,
      }"
      ><CheckCheck v-if="saveStatus === '已自动保存'" :size="14" /><AlertCircle
        v-else
        :size="14"
      />{{ saveStatus }}</span
    ><span class="local-badge">{{ storageLabel }}</span>
  </footer>
</template>
