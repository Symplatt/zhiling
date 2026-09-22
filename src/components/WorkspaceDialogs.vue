<script setup lang="ts">
import { X } from "lucide-vue-next";
import CharacterForm from "./CharacterForm.vue";
import RelationForm from "./RelationForm.vue";
import ProjectForm from "./ProjectForm.vue";
import ImportDialog from "./ImportDialog.vue";
import SettingsDialog from "./SettingsDialog.vue";
import LibraryDialog from "./LibraryDialog.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import HelpDialog from "./HelpDialog.vue";
import { useWorkspaceContext } from "../workspaceContext";
const {
  fullscreen,
  modal,
  creatingProject,
  isEditing,
  pendingImport,
  confirmation,
  trapFocus,
} = useWorkspaceContext();
</script>
<template>
  <Teleport to="body"
    ><div
      v-if="modal && !fullscreen"
      class="modal-backdrop"
      @click.self="modal = ''"
      @keydown="trapFocus"
    >
      <section
        class="modal"
        :class="{
          'wide-modal': modal === 'character' || modal === 'library',
          'settings-modal': modal === 'settings',
        }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'modal-title'"
      >
        <div class="modal-header">
          <div>
            <div class="eyebrow">
              {{
                modal === "character"
                  ? "CHARACTER"
                  : modal === "relation"
                    ? "RELATIONSHIP"
                    : "NOVEL ATLAS"
              }}
            </div>
            <h2 id="modal-title">
              {{
                modal === "character"
                  ? isEditing
                    ? "编辑角色档案"
                    : "让新角色走进故事"
                  : modal === "relation"
                    ? isEditing
                      ? "编辑人物关系"
                      : "连接两个人的故事"
                    : modal === "import"
                      ? "准备导入关系网"
                      : modal === "project"
                        ? creatingProject
                          ? "创建新的关系网"
                          : "编辑关系网信息"
                        : modal === "library"
                          ? "关系网列表"
                          : modal === "settings"
                            ? "让图谱更合心意"
                            : modal === "confirm"
                              ? confirmation?.title
                              : "你好，故事的创作者"
              }}
            </h2>
          </div>
          <button
            class="icon-button"
            aria-label="关闭对话框"
            @click="modal = ''"
          >
            <X :size="20" />
          </button>
        </div>
        <CharacterForm v-if="modal === 'character'" />
        <RelationForm v-else-if="modal === 'relation'" />
        <ProjectForm v-else-if="modal === 'project'" />
        <ImportDialog v-else-if="modal === 'import' && pendingImport" />
        <SettingsDialog v-else-if="modal === 'settings'" />
        <LibraryDialog v-else-if="modal === 'library'" />
        <ConfirmDialog v-else-if="modal === 'confirm' && confirmation" />
        <HelpDialog v-else />
      </section></div
  ></Teleport>
</template>
<style scoped>
/* Keep the settings header and action area outside the scrolling options. */
.modal.settings-modal {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.settings-modal > .modal-header {
  flex-shrink: 0;
}
</style>
