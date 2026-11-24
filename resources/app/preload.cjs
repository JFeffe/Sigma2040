'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shadowMandatePC', {
  readCampaigns: () => ipcRenderer.invoke('shadow-mandate:read-campaigns'),
  writeCampaign: (raw, checkpoint, slot, expected) =>
    ipcRenderer.invoke('shadow-mandate:write-campaign', raw, checkpoint, slot, expected),
  restoreCampaign: (raw, slot, expected) => ipcRenderer.invoke('shadow-mandate:restore-campaign', raw, slot, expected),
  confirm: (message, language) => ipcRenderer.invoke('shadow-mandate:confirm', message, language),
  setLanguage: language => ipcRenderer.send('shadow-mandate:language', language),
  quit: () => ipcRenderer.send('shadow-mandate:quit'),
});
