const { contextBridge, ipcRenderer } = require('electron');

const argVal = (name) => { const a = process.argv.find((t) => t.startsWith(name + '=')); return a ? a.slice(name.length + 1) : ''; };

contextBridge.exposeInMainWorld('api', {
  officeMode: argVal('--tvs-office') ? { app: argVal('--tvs-office'), mode: argVal('--tvs-mode') || 'new', sizePt: parseFloat(argVal('--tvs-size')) || 0, op: argVal('--tvs-op') } : null,
  quit: () => ipcRenderer.send('quit'),
  info: (msg) => ipcRenderer.invoke('info', msg),
  renderPng: (target, withData, release) => ipcRenderer.invoke('renderPng', target, !!withData, !!release),
  renderBatch: (ids) => ipcRenderer.invoke('renderBatch', ids),
  testClick: (x, y) => ipcRenderer.invoke('test-click', { x, y }),
  lib: (o) => ipcRenderer.invoke('lib', o),
  shared: (o) => ipcRenderer.invoke('shared', o),
  report: (o) => ipcRenderer.invoke('report', o),
  about: () => ipcRenderer.send('about'),
  capture: (opts) => ipcRenderer.invoke('capture', opts),
  pdf: () => ipcRenderer.invoke('pdf'),
  save: (data, file) => ipcRenderer.invoke('save', { data, file }),
  open: () => ipcRenderer.invoke('open'),
  copyText: (t) => ipcRenderer.invoke('copyText', t),
  confirm: (msg) => ipcRenderer.invoke('confirm', msg),
  setTitle: (t) => ipcRenderer.send('title', t),
  setDirty: (v) => ipcRenderer.send('dirty', !!v),
  draft: (o) => ipcRenderer.invoke('draft', o),
  onOpenFile: (cb) => ipcRenderer.on('openfile', (_e, r) => cb(r)),
  office: (opts) => ipcRenderer.invoke('office', opts),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
  onLibFile: (cb) => ipcRenderer.on('libfile', (_e, r) => cb(r)),
});
