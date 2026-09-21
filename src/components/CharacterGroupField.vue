<script setup lang="ts">
import { Check, Plus } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useWorkspaceContext } from "../workspaceContext";
const { draftCharacter, groups } = useWorkspaceContext();
const input = ref("");
const choices = computed(() =>
  [...new Set([...groups.value, ...draftCharacter.value.groups])].filter(
    (g) => g !== "未分组",
  ),
);
function toggle(group: string) {
  const selected = draftCharacter.value.groups;
  draftCharacter.value.groups = selected.includes(group)
    ? selected.filter((g) => g !== group)
    : [...selected, group];
}
function add() {
  const group = input.value.trim();
  if (!group || group === "未分组") return;
  if (!draftCharacter.value.groups.includes(group))
    draftCharacter.value.groups.push(group);
  input.value = "";
}
</script>
<template>
  <div class="character-groups">
    <label for="new-faction">所属阵营<span>（可多选）</span> </label>
    <div v-if="choices.length" class="group-choices">
      <button
        v-for="group in choices"
        :key="group"
        type="button"
        :aria-pressed="draftCharacter.groups.includes(group)"
        @click="toggle(group)"
      >
        <Check v-if="draftCharacter.groups.includes(group)" :size="12" />{{
          group
        }}
      </button>
    </div>
    <div class="new-group-row">
      <input
        id="new-faction"
        v-model="input"
        maxlength="60"
        placeholder="输入新阵营名称，按回车添加"
        @keydown.enter.prevent="add"
      />
      <button
        type="button"
        class="secondary-button"
        :disabled="!input.trim() || input.trim() === '未分组'"
        @click="add"
      >
        <Plus :size="14" />添加阵营
      </button>
    </div>
  </div>
</template>
