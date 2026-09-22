const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('desktop', {
  getExportSettings: () => ipcRenderer.invoke('atlas:export-settings'),
  setExportSetting: (kind,value) => ipcRenderer.invoke('atlas:export-setting',kind,value),
  chooseExportDirectory: kind => ipcRenderer.invoke('atlas:export-directory',kind),
  setFullscreen: value => ipcRenderer.invoke('atlas:fullscreen',value),
  onFullscreenChanged: callback => {
    const listener=(_,value)=>callback(value)
    ipcRenderer.on('atlas:fullscreen-changed',listener)
    return ()=>ipcRenderer.removeListener('atlas:fullscreen-changed',listener)
  },
  load: () => ipcRenderer.invoke('atlas:load'),
  save: data => ipcRenderer.invoke('atlas:save', data),
  importJson: () => ipcRenderer.invoke('atlas:import'),
  exportJson: data => ipcRenderer.invoke('atlas:export', data),
  exportImage: (buffer,title) => ipcRenderer.invoke('atlas:image',buffer,title),
  onClosing: callback => ipcRenderer.on('atlas:closing', () => callback()),
  close: () => ipcRenderer.invoke('atlas:close')
})
