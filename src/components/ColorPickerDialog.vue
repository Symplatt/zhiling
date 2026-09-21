<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { X } from "lucide-vue-next";
import { parseRgbColor } from "../colors";
import { hexToHsv, hsvToHex } from "../colorPicker";
const props = defineProps<{ color: string }>();
const emit = defineEmits<{ close: []; choose: [color: string] }>();
const hsv = ref(hexToHsv(props.color)),
  input = ref(props.color),
  error = ref("");
const panel = ref<HTMLElement>(),
  square = ref<HTMLElement>();
const previousFocus = document.activeElement as HTMLElement | null;
const preview = computed(() => hsvToHex(hsv.value.h, hsv.value.s, hsv.value.v));
function syncText() {
  input.value = preview.value;
  error.value = "";
}
function readText() {
  try {
    hsv.value = hexToHsv(parseRgbColor(input.value));
    error.value = "";
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function choose() {
  try {
    emit("choose", parseRgbColor(input.value));
  } catch (e) {
    error.value = (e as Error).message;
  }
}
function pick(event: PointerEvent) {
  if (
    !square.value ||
    (event.type === "pointermove" &&
      !square.value.hasPointerCapture(event.pointerId))
  )
    return;
  if (event.type === "pointerdown") {
    square.value.setPointerCapture(event.pointerId);
    square.value.focus();
  }
  const rect = square.value.getBoundingClientRect();
  hsv.value.s = Math.max(
    0,
    Math.min(1, (event.clientX - rect.left) / rect.width),
  );
  hsv.value.v = Math.max(
    0,
    Math.min(1, 1 - (event.clientY - rect.top) / rect.height),
  );
  syncText();
}
function squareKey(event: KeyboardEvent) {
  const step = event.shiftKey ? 0.1 : 0.01;
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key))
    return;
  event.preventDefault();
  hsv.value.s = Math.max(
    0,
    Math.min(
      1,
      hsv.value.s +
        (event.key === "ArrowRight"
          ? step
          : event.key === "ArrowLeft"
            ? -step
            : 0),
    ),
  );
  hsv.value.v = Math.max(
    0,
    Math.min(
      1,
      hsv.value.v +
        (event.key === "ArrowUp"
          ? step
          : event.key === "ArrowDown"
            ? -step
            : 0),
    ),
  );
  syncText();
}
function keydown(event: KeyboardEvent) {
  event.stopPropagation();
  if (event.key === "Escape") {
    event.preventDefault();
    emit("close");
  }
  if (event.key === "Tab") {
    const elements = [
        ...panel.value!.querySelectorAll<HTMLElement>(
          'button,input,[tabindex="0"]',
        ),
      ],
      first = elements[0]!,
      last = elements.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
onMounted(async () => {
  await nextTick();
  panel.value?.querySelector("input")?.focus();
});
onBeforeUnmount(() => previousFocus?.focus());
</script>
<template>
  <Teleport to="body">
    <div
      class="color-picker-backdrop"
      @click.self="emit('close')"
      @keydown="keydown"
    >
      <section
        ref="panel"
        class="color-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-picker-title"
      >
        <header>
          <h3 id="color-picker-title">添加自定义颜色</h3>
          <button
            type="button"
            class="icon-button"
            aria-label="关闭取色器"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>
        </header>
        <div
          ref="square"
          class="color-plane"
          :style="{ backgroundColor: `hsl(${hsv.h},100%,50%)` }"
          role="slider"
          tabindex="0"
          aria-label="饱和度与亮度，方向键调整"
          :aria-valuetext="`饱和度 ${Math.round(hsv.s * 100)}%，亮度 ${Math.round(hsv.v * 100)}%`"
          @pointerdown="pick"
          @pointermove="pick"
          @keydown="squareKey"
        >
          <i
            :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }"
          />
        </div>
        <label class="hue-label"
          >色相<input
            v-model.number="hsv.h"
            class="hue-slider"
            type="range"
            min="0"
            max="359"
            aria-label="色相"
            @input="syncText"
        /></label>
        <div class="picker-value-row">
          <span class="picker-preview" :style="{ background: preview }" /><label
            >HEX / RGB<input
              v-model="input"
              aria-label="颜色代码"
              maxlength="40"
              placeholder="#6B8E73 或 rgb(107, 142, 115)"
              :aria-invalid="!!error"
              @input="readText"
              @keydown.enter.prevent="choose"
          /></label>
        </div>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <footer>
          <button type="button" class="secondary-button" @click="emit('close')">
            取消</button
          ><button type="button" class="primary-button" @click="choose">
            添加颜色
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
