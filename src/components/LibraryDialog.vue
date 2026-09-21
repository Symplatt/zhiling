<script setup lang="ts">
import {
  Check,
  Download,
  Network,
  Plus,
  Search,
  Trash2,
} from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const {
  library,
  modal,
  bookQuery,
  books,
  activate,
  newProject,
  deleteStory,
  exportJson,
} = useWorkspaceContext();
</script>
<template>
  <div>
    <div class="book-tools">
      <div class="search-box">
        <Search :size="15" />
        <input
          v-model="bookQuery"
          placeholder="搜索关系网…"
          aria-label="搜索关系网"
        />
      </div>
      <button
        class="primary-button"
        aria-label="新建关系网"
        title="新建关系网"
        @click="newProject"
      >
        <Plus :size="15" />
      </button>
    </div>
    <p class="form-note">
      已有关系网： {{ library.graphs.length }} /
      1,000；每张关系网独立编辑和保存。
    </p>
    <div class="book-list">
      <div
        v-for="entry in books"
        :key="entry.id"
        class="book-row"
        :class="{ active: entry.id === library.activeId }"
      >
        <button class="book-open" @click="activate(entry.id)">
          <Network :size="22" /><span
            ><strong>{{ entry.data.title }}</strong
            ><small
              >{{ entry.data.characters.length }} 位角色 ·
              {{ entry.data.relations.length }} 条关系</small
            ></span
          ><Check v-if="entry.id === library.activeId" :size="16" /></button
        ><button
          class="icon-button danger-subtle"
          :aria-label="'删除关系网' + entry.data.title"
          @click="deleteStory(entry.id)"
        >
          <Trash2 :size="15" />
        </button>
      </div>
      <p v-if="!books.length" class="subtle-empty">没有找到匹配的关系网</p>
    </div>
    <div class="modal-actions">
      <button class="secondary-button" @click="exportJson(true)">
        <Download :size="15" />备份整个书架</button
      ><button class="primary-button" @click="modal = ''">完成</button>
    </div>
  </div>
</template>
