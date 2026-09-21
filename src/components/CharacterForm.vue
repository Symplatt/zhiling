<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
import CharacterColorField from "./CharacterColorField.vue";
import CharacterGroupField from "./CharacterGroupField.vue";
const {
  data,
  modal,
  formError,
  draftCharacter,
  isEditing,
  sortedCharacters,
  submitCharacter,
} = useWorkspaceContext();
</script>
<template>
  <form @submit.prevent="submitCharacter">
    <div class="form-grid">
      <label
        >角色名称 <span>*</span
        ><input v-model="draftCharacter.name" required maxlength="60"
      /></label>
    </div>
    <CharacterGroupField />
    <label
      >角色标签<input
        v-model="draftCharacter.tags"
        placeholder="用空格分隔多个标签"
        maxlength="200"
    /></label>
    <CharacterColorField />

    <details
      v-if="!isEditing && data.characters.length"
      class="initial-relation"
    >
      <summary>同时添加一条初始关系 <span>可选</span></summary>
      <div class="form-grid">
        <label
          >关联角色<select v-model="draftCharacter.initialTo">
            <option value="">暂不添加</option>
            <option v-for="c in sortedCharacters" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select></label
        ><label
          >关系名称<input
            v-model="draftCharacter.initialLabel"
            maxlength="60"
            placeholder="新角色是对方的…"
        /></label>
      </div>
      <label
        >关系方向<select v-model="draftCharacter.initialDirection">
          <option value="one-way">新角色 → 所选角色</option>
          <option value="reverse">所选角色 → 新角色</option>
          <option value="two-way">新角色 ↔ 所选角色</option>
        </select></label
      >
    </details>
    <p v-if="formError" class="form-error" role="alert">
      {{ formError }}
    </p>
    <div class="modal-actions">
      <button type="button" class="secondary-button" @click="modal = ''">
        取消</button
      ><button type="submit" class="primary-button">
        <Check :size="15" />{{ isEditing ? "保存修改" : "添加角色" }}
      </button>
    </div>
  </form>
</template>
