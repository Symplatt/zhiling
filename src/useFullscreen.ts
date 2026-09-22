import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useFullscreen(onError: (message: string, error?: boolean) => void) {
  const fullscreen = ref(false)
  let unsubscribe: (() => void) | undefined
  const changed = () => { fullscreen.value = !!document.fullscreenElement }
  async function toggleFullscreen() {
    try {
      if (window.desktop) fullscreen.value = await window.desktop.setFullscreen(!fullscreen.value)
      else if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { onError('无法进入全屏，请重试。', true) }
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'F11' || (event.key === 'Escape' && fullscreen.value)) {
      event.preventDefault()
      event.stopImmediatePropagation()
      void toggleFullscreen()
    }
  }
  onMounted(() => {
    document.addEventListener('fullscreenchange', changed)
    document.addEventListener('keydown', keydown, true)
    unsubscribe = window.desktop?.onFullscreenChanged(value => { fullscreen.value = value })
  })
  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', changed)
    document.removeEventListener('keydown', keydown, true)
    unsubscribe?.()
  })
  return { fullscreen, toggleFullscreen }
}
