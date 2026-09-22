export type ExportKind = 'png' | 'json'
export interface ExportDestination { directory: string; ask: boolean }
export type ExportSettings = Record<ExportKind, ExportDestination>

// Directory handles are machine-local capabilities, never part of a story or JSON backup.
interface DirectoryHandle {
  name: string
  queryPermission(options: { mode: string }): Promise<string>
  requestPermission(options: { mode: string }): Promise<string>
  getFileHandle(name: string, options?: { create: boolean }): Promise<FileHandle>
}
interface FileHandle { createWritable(): Promise<{ write(blob: Blob): Promise<void>; close(): Promise<void> }> }
interface FilePickerWindow {
  showDirectoryPicker?: (options: { mode: string }) => Promise<DirectoryHandle>
  showSaveFilePicker?: (options: unknown) => Promise<FileHandle>
}
const pickers = window as unknown as FilePickerWindow
export const canChooseExportDirectory = !!window.desktop || !!pickers.showDirectoryPicker
const defaults = (): ExportSettings => ({ png: { directory: '', ask: true }, json: { directory: '', ask: true } })

async function localRecord<T>(key: string, value?: T): Promise<T | undefined> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('zhiling-export-settings', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('preferences')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = database.transaction('preferences', value === undefined ? 'readonly' : 'readwrite')
      const store = transaction.objectStore('preferences')
      const request = value === undefined ? store.get(key) : store.put(value, key)
      transaction.oncomplete = () => resolve(value === undefined ? request.result : value)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { database.close() }
}
export async function loadExportSettings(): Promise<ExportSettings> {
  return window.desktop ? window.desktop.getExportSettings() : await localRecord<ExportSettings>('settings') || defaults()
}
export async function saveExportSetting(kind: ExportKind, value: ExportDestination) {
  if (window.desktop) return window.desktop.setExportSetting(kind, value)
  const settings = await loadExportSettings()
  settings[kind] = value
  await localRecord('settings', settings)
  return settings
}
export async function chooseExportDirectory(kind: ExportKind): Promise<string | undefined> {
  if (window.desktop) return (await window.desktop.chooseExportDirectory(kind)) || undefined
  if (!pickers.showDirectoryPicker) return undefined
  const handle = await pickers.showDirectoryPicker({ mode: 'readwrite' })
  await localRecord(`directory-${kind}`, handle)
  return handle.name
}
/** Obtain permission while the export click still has transient user activation. */
export async function prepareBrowserFile(kind: ExportKind, filename: string, download: (blob: Blob, name: string) => void): Promise<(blob: Blob) => Promise<void>> {
  const settings = await loadExportSettings()
  const directory = await localRecord<DirectoryHandle>(`directory-${kind}`)
  let file: FileHandle
  if (settings[kind].ask && pickers.showSaveFilePicker) {
    file = await pickers.showSaveFilePicker({ suggestedName: filename, startIn: directory,
      types: [{ description: kind.toUpperCase(), accept: { [kind === 'png' ? 'image/png' : 'application/json']: [`.${kind}`] } }] })
  } else if (!settings[kind].ask && directory) {
    if (await directory.queryPermission({ mode: 'readwrite' }) !== 'granted' &&
      await directory.requestPermission({ mode: 'readwrite' }) !== 'granted') throw new Error('没有导出文件夹的写入权限，请重新选择位置。')
    const stem = filename.slice(0, -(kind.length + 1))
    let name = filename, index = 1
    for (;;) {
      try { await directory.getFileHandle(name); name = `${stem} (${++index}).${kind}` }
      catch (error) { if ((error as DOMException).name === 'NotFoundError') break; throw error }
    }
    file = await directory.getFileHandle(name, { create: true })
  } else { return async blob => { download(blob, filename) } }
  return async blob => {
    const stream = await file.createWritable()
    await stream.write(blob)
    await stream.close()
  }
}

export async function exportBrowserFile(kind: ExportKind, blob: Blob, filename: string, download: (blob: Blob, name: string) => void) {
  const write = await prepareBrowserFile(kind, filename, download)
  await write(blob)
}
