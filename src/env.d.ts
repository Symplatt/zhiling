declare module 'cytoscape-fcose' {
  import type { Ext } from 'cytoscape'
  const extension: Ext
  export default extension
}
interface Window {
  desktop?: {
    getExportSettings: () => Promise<import('./exportSettings').ExportSettings>
    setExportSetting: (kind: import('./exportSettings').ExportKind, value: import('./exportSettings').ExportDestination) => Promise<import('./exportSettings').ExportSettings>
    chooseExportDirectory: (kind: import('./exportSettings').ExportKind) => Promise<string | null>
    setFullscreen: (value: boolean) => Promise<boolean>
    onFullscreenChanged: (callback: (value: boolean) => void) => () => void
    load: () => Promise<{ data: unknown | null; error?: string }>
    save: (data: unknown) => Promise<void>
    importJson: () => Promise<{ data: unknown; warnings: string[] } | null>
    exportJson: (data: unknown) => Promise<boolean>
    exportImage: (data: ArrayBuffer, title: string) => Promise<boolean>
    onClosing: (callback: () => void) => void
    close: () => Promise<void>
  }
}
