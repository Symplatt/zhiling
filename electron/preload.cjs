const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('desktop', {
  load: () => ipcRenderer.invoke('atlas:load'),
  save: data => ipcRenderer.invoke('atlas:save', data),
  importJson: () => ipcRenderer.invoke('atlas:import'),
  exportJson: data => ipcRenderer.invoke('atlas:export', data),
  chooseAvatar: () => ipcRenderer.invoke('atlas:avatar'),
  onClosing: callback => ipcRenderer.on('atlas:closing', () => callback()),
  close: () => ipcRenderer.invoke('atlas:close')
})
