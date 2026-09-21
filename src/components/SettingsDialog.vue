<script setup lang="ts">
import { Check, Network } from "lucide-vue-next";
import { useWorkspaceContext } from "../workspaceContext";
const { labels, neighborhood, layout, modal, theme, themes, changeTheme } =
  useWorkspaceContext();
</script>
<template>
  <div>
    <div class="theme-grid">
      <button
        v-for="item in themes"
        :key="item.id"
        class="theme-card"
        :class="{ selected: theme === item.id }"
        :aria-pressed="theme === item.id"
        @click="changeTheme(item.id)"
      >
        <span
          class="theme-swatch"
          :style="{ background: item.background, color: item.color }"
          ><Network :size="22" /><Check
            v-if="theme === item.id"
            :size="12" /></span
        ><strong>{{ item.name }}</strong
        ><small>{{ item.description }}</small>
      </button>
    </div>
    <div class="setting-row">
      <div>
        <strong>显示关系标签</strong>
        <p>在连线上显示人物之间的关系名称</p>
      </div>
      <button
        class="switch"
        :class="{ on: labels }"
        role="switch"
        :aria-checked="labels"
        aria-label="显示关系标签"
        @click="labels = !labels"
      >
        <i></i>
      </button>
    </div>
    <div class="setting-row">
      <div>
        <strong>聚焦一度关系</strong>
        <p>淡化与当前角色没有直接关联的内容</p>
      </div>
      <button
        class="switch"
        :class="{ on: neighborhood }"
        role="switch"
        :aria-checked="neighborhood"
        aria-label="聚焦一度关系"
        @click="neighborhood = !neighborhood"
      >
        <i></i>
      </button>
    </div>
    <label class="layout-setting"
      >自动布局方式<select v-model="layout">
        <option value="fcose">自然分布 · fCoSE</option>
        <option value="circle">环形分布 · Circle</option>
      </select></label
    >
    <p class="dialog-copy">
      自动布局会为角色留出间距。密集关系仍可能交叉，可放大查看或按阵营筛选。
    </p>
    <div class="modal-actions">
      <button class="primary-button" @click="modal = ''">完成</button>
    </div>
  </div>
</template>
