<script setup lang="ts">
import { ArrowLeftRight, ArrowRight, Link2 } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const {
  data,
  modal,
  formError,
  draftRelation,
  name,
  relationLabel,
  submitRelation,
} = useWorkspaceContext();
</script>
<template>
  <form @submit.prevent="submitRelation">
    <div class="form-grid">
      <label
        >起点角色（A）<select v-model="draftRelation.from" required>
          <option value="" disabled>选择角色</option>
          <option v-for="c in data.characters" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select></label
      ><label
        >终点角色（B）<select v-model="draftRelation.to" required>
          <option value="" disabled>选择角色</option>
          <option v-for="c in data.characters" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select></label
      >
    </div>
    <label>关系方向</label>
    <div class="direction-options">
      <button
        type="button"
        :class="{ selected: draftRelation.direction === 'one-way' }"
        @click="draftRelation.direction = 'one-way'"
      >
        <ArrowRight :size="21" /><strong>单向关系</strong
        ><small>起点 → 终点</small></button
      ><button
        type="button"
        :class="{ selected: draftRelation.direction === 'two-way' }"
        @click="draftRelation.direction = 'two-way'"
      >
        <ArrowLeftRight :size="21" /><strong>双向关系</strong
        ><small>起点 ↔ 终点</small>
      </button>
    </div>
    <label
      >关系名称<input
        v-model="draftRelation.label"
        required
        maxlength="120"
        placeholder="例如：朋友、母女、母亲/女儿"
    /></label>
    <div class="relationship-preview">
      {{ name(draftRelation.from) }}
      {{ draftRelation.direction === "two-way" ? "↔" : "→" }}
      {{ name(draftRelation.to)
      }}<span>{{ relationLabel(draftRelation) || "关系名称" }}</span>
    </div>
    <label
      >关系描述<textarea
        v-model="draftRelation.description"
        rows="3"
        maxlength="30000"
        placeholder="他们之间，发生过怎样的故事？"
      />
    </label>
    <p class="form-note">单向示例：甲 → 乙，标签“姐姐”，表示甲是乙的姐姐。</p>
    <p v-if="formError" class="form-error" role="alert">
      {{ formError }}
    </p>
    <div class="modal-actions">
      <button type="button" class="secondary-button" @click="modal = ''">
        取消</button
      ><button type="submit" class="primary-button">
        <Link2 :size="15" />保存关系
      </button>
    </div>
  </form>
</template>
