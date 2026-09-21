<script setup lang="ts">
import { AlertCircle, Check, X } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const { toast, toastError } = useWorkspaceContext();
</script>
<template>
  <Transition name="toast"
    ><div
      v-if="toast"
      class="toast-message"
      :class="{ error: toastError }"
      role="status"
    >
      <AlertCircle v-if="toastError" :size="18" /><Check
        v-else
        :size="18"
      /><span>{{ toast }}</span
      ><button
        class="icon-button small"
        aria-label="关闭提示"
        @click="toast = ''"
      >
        <X :size="14" />
      </button></div
  ></Transition>
</template>
