<script setup lang="ts">
defineProps<{ name: string }>();
</script>
<template>
  <span
    class="self-reference"
    :title="`指代当前角色：${name}（非角色姓名）`"
    :aria-label="`当前角色：${name}`"
    >〔本人〕</span
  >
</template>
