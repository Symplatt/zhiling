<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { ImagePlus, Trash2 } from 'lucide-vue-next';
import { cropAvatar } from '../avatars';
import { useWorkspaceContext } from '../workspaceContext';
const { draftCharacter } = useWorkspaceContext();
const emit = defineEmits<{ busy: [value: boolean] }>();
const input = ref<HTMLInputElement>();
const error = ref(''), busy = ref(false);
let request = 0;
onBeforeUnmount(() => { request++; });
async function upload(event: Event) {
  const control = event.target as HTMLInputElement, file = control.files?.[0]; control.value = '';
  if (!file) return;
  const current = ++request;
  busy.value = true; emit('busy', true); error.value = '';
  try { const avatar = await cropAvatar(file); if (current === request) draftCharacter.value.avatar = avatar; }
  catch (e) { if (current === request) error.value = e instanceof Error ? e.message : '图片无法读取，请换一张图片。'; }
  finally { if (current === request) { busy.value = false; emit('busy', false); } }
}
</script>
<template>
  <div class="avatar-editor">
    <button type="button" class="avatar-upload" :style="{borderColor:draftCharacter.color}" :disabled="busy" aria-label="上传角色头像" @click="input?.click()">
      <img v-if="draftCharacter.avatar" :src="draftCharacter.avatar" alt="角色头像预览" />
      <ImagePlus v-else :size="28" />
    </button>
    <div class="avatar-editor-actions">
      <strong>{{ busy ? '正在处理图片…' : '角色头像' }}</strong>
      <span>居中裁剪，圆形显示</span>
      <div>
        <button type="button" class="text-button" :disabled="busy" @click="input?.click()">{{ draftCharacter.avatar ? '更换图片' : '选择图片' }}</button>
        <button v-if="draftCharacter.avatar" type="button" class="text-button" :disabled="busy" @click="draftCharacter.avatar = ''"><Trash2 :size="13" />移除</button>
      </div>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    </div>
    <input ref="input" type="file" accept="image/png,image/jpeg,image/webp" class="hidden-input" aria-label="选择角色头像文件" @change="upload" />
  </div>
</template>
