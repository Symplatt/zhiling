declare module 'cytoscape-fcose' {
  import type { Ext } from 'cytoscape'
  const extension: Ext
  export default extension
}
interface Window {
  desktop?: {
    load: () => Promise<{ data: unknown | null; error?: string }>
    save: (data: unknown) => Promise<void>
    importJson: () => Promise<{ data: unknown; warnings: string[] } | null>
    exportJson: (data: unknown) => Promise<boolean>
    exportImage: (data: ArrayBuffer, title: string) => Promise<boolean>
    onClosing: (callback: () => void) => void
    close: () => Promise<void>
  }
}
