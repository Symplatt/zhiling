<script setup lang="ts">
import { useWorkspaceContext } from "../workspaceContext";
const { modal, confirmation } = useWorkspaceContext();
</script>
<template>
  <div v-if="confirmation">
    <p class="dialog-copy">{{ confirmation.description }}</p>
    <div class="modal-actions">
      <button class="secondary-button" @click="modal = ''">取消</button
      ><button
        :class="confirmation.destructive ? 'danger-button' : 'primary-button'"
        @click="confirmation.action"
      >
        {{ confirmation.destructive ? "确认删除" : "新建故事" }}
      </button>
    </div>
  </div>
</template>
