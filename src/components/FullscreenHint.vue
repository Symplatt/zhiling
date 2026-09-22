<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ active: boolean }>()
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

// Derive the hint from confirmed fullscreen state, not a possibly rejected request.
watch(() => props.active, active => {
  clearTimeout(timer)
  visible.value = active
  if (active) timer = setTimeout(() => { visible.value = false }, 3000)
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div v-if="active && visible" class="fullscreen-exit-hint" role="status" aria-live="polite">
    按 <kbd>ESC</kbd> 退出
  </div>
</template>

<style scoped>
.fullscreen-exit-hint {
  position: fixed;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
  color: var(--text);
  box-shadow: 0 6px 24px #0002;
  font-size: 14px;
  pointer-events: none;
  animation: hint-appear 180ms ease;
}
kbd { font: inherit; color: var(--green); }
@keyframes hint-appear { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .fullscreen-exit-hint { animation: none; }
}
</style>
