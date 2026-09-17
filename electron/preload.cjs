const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('desktop', {
  load: () => ipcRenderer.invoke('atlas:load'),
  save: data => ipcRenderer.invoke('atlas:save', data),
  importJson: () => ipcRenderer.invoke('atlas:import'),
  exportJson: data => ipcRenderer.invoke('atlas:export', data),
  exportImage: (buffer,title) => ipcRenderer.invoke('atlas:image',buffer,title),
  onClosing: callback => ipcRenderer.on('atlas:closing', () => callback()),
  close: () => ipcRenderer.invoke('atlas:close')
})
