<script setup lang="ts">
import { useWorkspaceContext } from "../workspaceContext";
const { modal } = useWorkspaceContext();
</script>
<template>
  <div class="help-content">
    <p class="dialog-copy">
      织灵，帮你把脑海中的人物与故事连接起来。所有内容仅保存在本机，随时可以导出
      JSON 带走。
    </p>
    <div class="help-step">
      <span>01</span>
      <div>
        <strong>让人物登场</strong>
        <p>新增角色，写下姓名、小传和阵营，用空格分隔标签。</p>
      </div>
    </div>
    <div class="help-step">
      <span>02</span>
      <div>
        <strong>让故事相连</strong>
        <p>添加单向或双向关系；同一对人物可以拥有多条关系。</p>
      </div>
    </div>
    <div class="help-step">
      <span>03</span>
      <div>
        <strong>把全貌看清</strong>
        <p>
          滚轮缩放，拖动画布，点击角色查看档案。利用阵营筛选与一度关系聚焦复杂网络。
        </p>
      </div>
    </div>
    <div class="shortcut-row">
      <span>保存 <kbd>Ctrl S</kbd></span
      ><span>撤销 <kbd>Ctrl Z</kbd></span
      ><span>重做 <kbd>Ctrl Y</kbd></span>
    </div>
    <p class="form-note">
      从左侧打开关系网书架，可独立保存 1,000
      张关系网。悬停角色可查看所有关系；点击悬浮窗口右上角图钉可固定窗口。导出图片始终包含整张关系网。
    </p>
    <div class="modal-actions help-footer">
      <p class="help-author">© 2026 Symplatt 版权所有</p>
      <button class="primary-button" @click="modal = ''">开始创作</button>
    </div>
  </div>
</template>

<style scoped>
.help-footer { justify-content: space-between; align-items: flex-end; gap: 16px; }
.help-footer .help-author { margin: 0; }
</style>
