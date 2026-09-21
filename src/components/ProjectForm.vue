<script setup lang="ts">
import { useWorkspaceContext } from "../workspaceContext";
const { modal, formError, draftProject, creatingProject, submitProject } =
  useWorkspaceContext();
</script>
<template>
  <form @submit.prevent="submitProject">
    <label
      >关系网名称<input
        v-model="draftProject.title"
        required
        maxlength="80"
        placeholder="给故事起个名字"
    /></label>
    <p v-if="formError" class="form-error">{{ formError }}</p>
    <div class="modal-actions">
      <button type="button" class="secondary-button" @click="modal = ''">
        取消</button
      ><button type="submit" class="primary-button">
        {{ creatingProject ? "创建关系网" : "保存信息" }}
      </button>
    </div>
  </form>
</template>
