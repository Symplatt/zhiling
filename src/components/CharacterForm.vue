<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
import CharacterColorField from "./CharacterColorField.vue";
const {
  data,
  modal,
  formError,
  draftCharacter,
  isEditing,
  groups,
  submitCharacter,
} = useWorkspaceContext();
</script>
<template>
  <form @submit.prevent="submitCharacter">
    <div class="form-grid">
      <label
        >角色名称 <span>*</span
        ><input
          v-model="draftCharacter.name"
          required
          maxlength="60"
          placeholder="这个角色叫什么？" /></label
      ><label
        >所属阵营<input
          v-model="draftCharacter.group"
          list="group-options"
          maxlength="60"
          placeholder="例如：花家、云岫门" /><datalist id="group-options">
          <option v-for="g in groups" :key="g" :value="g" /></datalist
      ></label>
    </div>
    <label
      >角色标签<input
        v-model="draftCharacter.tags"
        placeholder="侠客 仙子 金丹后期（用空格分隔标签）"
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
            <option v-for="c in data.characters" :key="c.id" :value="c.id">
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
          <option value="two-way">新角色 ↔ 所选角色</option>
        </select></label
      >
    </details>
    <p class="form-note">角色 ID：{{ draftCharacter.id }} · 唯一且不可修改</p>
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
