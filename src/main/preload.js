const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('browserAPI', {
  minimize: () => ipcRenderer.send('win:minimize'),
  maximize: () => ipcRenderer.send('win:maximize'),
  close: () => ipcRenderer.send('win:close'),
  playInVlc: (url) => ipcRenderer.invoke('vlc:play', url),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});
