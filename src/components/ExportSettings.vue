<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { canChooseExportDirectory, chooseExportDirectory, loadExportSettings, saveExportSetting, type ExportKind, type ExportSettings } from '../exportSettings'
const settings = ref<ExportSettings>()
const error = ref(''), busy = ref(false)
const kinds: { id: ExportKind; name: string }[] = [{ id: 'png', name: 'PNG 图片' }, { id: 'json', name: 'JSON 文件' }]
onMounted(async () => { try { settings.value = await loadExportSettings() } catch (e) { error.value = String(e) } })
async function change(kind: ExportKind, choose: boolean) {
  if (!settings.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    const current = settings.value[kind]
    const directory = choose ? await chooseExportDirectory(kind) : current.directory
    if (directory === undefined) return
    settings.value = await saveExportSetting(kind, { directory, ask: choose ? current.ask : !current.ask })
  } catch (e) { if ((e as DOMException).name !== 'AbortError') error.value = String(e) }
  finally { busy.value = false }
}
</script>
<template>
  <section class="export-settings" aria-label="导出位置设置">
    <h3>导出位置</h3>
    <p class="form-note">两种文件分别设置；仅保存在本机。关闭询问后，同名文件自动编号。</p>
    <div v-for="kind in kinds" :key="kind.id" class="destination">
      <template v-if="settings">
        <div class="destination-path">
          <span><strong>{{ kind.name }}</strong><small :title="settings[kind.id].directory">{{ settings[kind.id].directory || '浏览器默认下载位置' }}</small></span>
          <button class="secondary-button" :aria-label="`选择 ${kind.name} 导出文件夹`" :disabled="busy || !canChooseExportDirectory" @click="change(kind.id, true)">选择文件夹</button>
        </div>
        <label class="ask-location"><input type="checkbox" :checked="settings[kind.id].ask" :disabled="busy || !canChooseExportDirectory || !settings[kind.id].directory" @change="change(kind.id, false)" />每次导出 {{ kind.name }} 时询问位置</label>
      </template>
    </div>
    <p v-if="!canChooseExportDirectory" class="form-note">此浏览器不支持选择文件夹，下载位置由浏览器管理；桌面版支持完整设置。</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </section>
</template>
<style scoped>
.export-settings { border-top: 1px solid var(--line); margin-top: 24px; padding-top: 16px; }
h3 { font-size: 14px; margin: 0; }
.destination { margin-top: 14px; }
.destination-path { display: flex; align-items: center; gap: 16px; }
.destination-path > span { flex: 1; min-width: 0; }
.destination-path strong { font-size: 13px; }
.destination-path small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); margin-top: 4px; }
.destination-path button { flex-shrink: 0; }
.ask-location { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; }
.ask-location input { width: 15px; height: 15px; margin: 0; accent-color: var(--green); }
</style>
