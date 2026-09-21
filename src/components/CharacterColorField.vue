<script setup lang="ts">
import { computed, ref } from "vue";
import { Check, Plus } from "lucide-vue-next";
import { rememberCustomColor } from "../colors";
import { useWorkspaceContext } from "../workspaceContext";
import ColorPickerDialog from "./ColorPickerDialog.vue";
const { draftCharacter, library, palette, persist } = useWorkspaceContext();
const open = ref(false);
const history = computed(() => library.value.customColors || []);
function add(color: string) {
  draftCharacter.value.color = color;
  library.value.customColors = rememberCustomColor(history.value, color);
  void persist().catch(() => {});
  open.value = false;
}
</script>
<template>
  <div class="character-colors">
    <label>角色颜色</label>
    <div class="unified-colors" aria-label="角色边框颜色">
      <button
        v-for="(color, index) in [...palette, ...history]"
        :key="`${index}-${color}`"
        type="button"
        class="color-swatch"
        :style="{ background: color }"
        :title="`${index < palette.length ? '预设' : '自定义'} ${color}`"
        :aria-label="`${index < palette.length ? '预设颜色' : '自定义颜色'} ${color}`"
        :aria-pressed="draftCharacter.color === color"
        @click="draftCharacter.color = color"
      >
        <Check v-if="draftCharacter.color === color" :size="14" />
      </button>
      <button
        type="button"
        class="color-swatch add-color"
        aria-label="添加自定义颜色"
        title="添加自定义颜色"
        @click="open = true"
      >
        <Plus :size="15" />
      </button>
    </div>
    <ColorPickerDialog
      v-if="open"
      :color="draftCharacter.color"
      @close="open = false"
      @choose="add"
    />
  </div>
</template>
