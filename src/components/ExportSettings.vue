<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { FolderOpen } from 'lucide-vue-next'
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
    <p class="form-note">默认导出目录；不询问位置时，同名文件自动编号。</p>
    <div v-for="kind in kinds" :key="kind.id" class="destination">
      <template v-if="settings">
        <div class="destination-heading">
          <strong>{{ kind.name }}</strong>
          <label class="ask-location"><input type="checkbox" :aria-label="`每次导出 ${kind.name} 时询问位置`" :checked="settings[kind.id].ask" :disabled="busy || !canChooseExportDirectory || !settings[kind.id].directory" @change="change(kind.id, false)" />每次询问位置</label>
        </div>
        <div class="destination-path">
          <span :title="settings[kind.id].directory">{{ settings[kind.id].directory || '浏览器默认下载位置' }}</span>
          <button class="change-directory" :aria-label="`选择 ${kind.name} 导出文件夹`" :title="`更改 ${kind.name} 导出文件夹`" :disabled="busy || !canChooseExportDirectory" @click="change(kind.id, true)"><FolderOpen :size="16" /></button>
        </div>
      </template>
    </div>
    <p v-if="!canChooseExportDirectory" class="form-note">此浏览器不支持选择文件夹，下载位置由浏览器管理；桌面版支持完整设置。</p>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
  </section>
</template>
<style scoped>
.export-settings { border-top: 1px solid var(--line); margin-top: 24px; padding-top: 16px; }
h3 { font-size: 14px; margin: 0; }
.destination { margin-top: 20px; }
.destination-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
.destination-heading strong { font-size: 12px; font-weight: 500; color: var(--muted); }
.destination-path { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); }
.destination-path > span { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 14px; line-height: 1.5; color: var(--text); }
.change-directory { display: grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--muted); }
.change-directory:hover:not(:disabled) { background: var(--soft); color: var(--text); }
.ask-location { display: flex; flex-direction: row; align-items: center; gap: 6px; margin: 0; font-size: 11px; font-weight: 400; color: var(--muted); }
.ask-location input { width: 12px; height: 12px; margin: 0; accent-color: var(--muted); }
</style>
