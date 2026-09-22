<script setup lang="ts">
import { useWorkspaceContext } from "../workspaceContext";
const { library, chooseCopySource, modal, formError, draftProject, creatingProject, submitProject } =
  useWorkspaceContext();
</script>
<template>
  <form @submit.prevent="submitProject">
    <label v-if="creatingProject">复制已有关系网
      <select aria-label="复制已有关系网" v-model="draftProject.copyFrom" @change="chooseCopySource">
        <option value="">不复制，创建空白关系网</option>
        <option v-for="entry in library.graphs" :key="entry.id" :value="entry.id">{{ entry.data.title }}</option>
      </select>
    </label>
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
