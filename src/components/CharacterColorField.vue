<script setup lang="ts">
import { computed, ref } from "vue";
import { Check } from "lucide-vue-next";
import { parseRgbColor, rememberCustomColor } from "../colors";
import { useWorkspaceContext } from "../workspaceContext";
const { draftCharacter, library, palette, persist } = useWorkspaceContext();
const input = ref(""),
  error = ref("");
const history = computed(() => library.value.customColors || []);
function applyColor() {
  try {
    const color = parseRgbColor(input.value);
    draftCharacter.value.color = color;
    input.value = color;
    error.value = "";
    library.value.customColors = rememberCustomColor(history.value, color);
    void persist().catch(() => {});
  } catch (e) {
    error.value = (e as Error).message;
  }
}
</script>
<template>
  <div class="character-colors">
    <div class="color-field preset-colors">
      <span>预设颜色</span>
      <button
        v-for="color in palette"
        :key="color"
        type="button"
        class="color-swatch"
        :style="{ background: color }"
        :aria-label="`角色颜色 ${color}`"
        :aria-pressed="draftCharacter.color === color"
        @click="draftCharacter.color = color"
      >
        <Check v-if="draftCharacter.color === color" :size="14" />
      </button>
    </div>
    <label for="custom-border-color">自定义边框颜色</label>
    <div class="custom-color-input">
      <input
        id="custom-border-color"
        v-model="input"
        placeholder="#6B8E73 或 rgb(107, 142, 115)"
        maxlength="40"
        :aria-invalid="!!error"
        :aria-describedby="error ? 'custom-color-error' : 'custom-color-hint'"
        @input="error = ''"
        @keydown.enter.prevent="applyColor"
      />
      <button type="button" class="secondary-button" @click="applyColor">
        使用颜色
      </button>
    </div>
    <p v-if="error" id="custom-color-error" class="form-error" role="alert">
      {{ error }}
    </p>
    <div
      v-if="history.length"
      class="color-field recent-colors"
      aria-label="最近自定义颜色"
    >
      <span>最近添加</span>
      <button
        v-for="color in history"
        :key="color"
        type="button"
        class="color-swatch"
        :style="{ background: color }"
        :title="color"
        :aria-label="`自定义颜色 ${color}`"
        :aria-pressed="draftCharacter.color === color"
        @click="
          draftCharacter.color = color;
          input = color;
          error = '';
        "
      >
        <Check v-if="draftCharacter.color === color" :size="14" />
      </button>
    </div>
    <p id="custom-color-hint" class="form-note">
      最多保留 7 种，左侧最早添加；预设颜色始终可用。
    </p>
  </div>
</template>
