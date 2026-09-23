<script setup lang="ts">
import { AlertCircle, CheckCheck, Link2, Users } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
import { computed } from 'vue';
const { data, recoveryBlocked, displaySaveStatus: saveStatus, storageLabel, lastEdited } =
  useWorkspaceContext();
const editedText = computed(() => {
  const date = new Date(lastEdited.value);
  return Number.isNaN(date.getTime()) ? '暂无记录' : date.toLocaleString('zh-CN', { hour12: false });
});
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
    <span class="last-edited">最近编辑时间：<time :datetime="lastEdited">{{ editedText }}</time></span>
  </footer>
</template>
<style scoped>
.last-edited { flex-shrink: 0; font-variant-numeric: tabular-nums; }
</style>
