// popup.js
const enabledToggle = document.getElementById('enabledToggle');
const modeSelect = document.getElementById('modeSelect');
const siteOriginEl = document.getElementById('siteOrigin');
const posInfo = document.getElementById('posInfo');
const resetPosBtn = document.getElementById('resetPos');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const applyImportBtn = document.getElementById('applyImport');
const jsonArea = document.getElementById('jsonArea');
const clearSiteBtn = document.getElementById('clearSite');
const statusEl = document.getElementById('status');

let currentOrigin = null;
let settings = {}; // full settings object

function showStatus(msg, timeout = 2500) {
  statusEl.textContent = msg;
  if (timeout) setTimeout(()=> statusEl.textContent = '', timeout);
}

async function getActiveTabOrigin() {
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  if (!tab || !tab.url) return null;
  try {
    const url = new URL(tab.url);
    return url.origin;
  } catch (e) {
    return null;
  }
}

async function loadSettings() {
  currentOrigin = await getActiveTabOrigin();
  siteOriginEl.textContent = currentOrigin || 'Unknown';
  const data = await chrome.storage.local.get('quicknav_settings');
  settings = data.quicknav_settings || {};
  const siteKey = currentOrigin || '__unknown__';
  const siteSettings = settings[siteKey] || { enabled: true, mode: 'floating', position: null };
  enabledToggle.checked = !!siteSettings.enabled;
  modeSelect.value = siteSettings.mode || 'floating';
  if (siteSettings.position) {
    posInfo.textContent = `x: ${siteSettings.position.x}, y: ${siteSettings.position.y}`;
  } else {
    posInfo.textContent = 'Not set';
  }
}

async function saveSiteSettings() {
  if (!currentOrigin) return;
  const siteKey = currentOrigin;
  settings[siteKey] = settings[siteKey] || {};
  settings[siteKey].enabled = enabledToggle.checked;
  settings[siteKey].mode = modeSelect.value;
  await chrome.storage.local.set({ quicknav_settings: settings });
  showStatus('Saved');
  // notify content script to re-inject or remove
  const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdated' }).catch(()=>{});
  }
}

enabledToggle.addEventListener('change', saveSiteSettings);
modeSelect.addEventListener('change', saveSiteSettings);

resetPosBtn.addEventListener('click', async () => {
  if (!currentOrigin) return;
  const siteKey = currentOrigin;
  if (settings[siteKey]) {
    delete settings[siteKey].position;
    await chrome.storage.local.set({ quicknav_settings: settings });
    posInfo.textContent = 'Not set';
    showStatus('Position reset');
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (tab && tab.id) chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdated' }).catch(()=>{});
  }
});

exportBtn.addEventListener('click', async () => {
  const data = await chrome.storage.local.get('quicknav_settings');
  const json = JSON.stringify(data.quicknav_settings || {}, null, 2);
  jsonArea.value = json;
  showStatus('Exported to text area');
});

importBtn.addEventListener('click', () => {
  jsonArea.focus();
});

applyImportBtn.addEventListener('click', async () => {
  const text = jsonArea.value.trim();
  if (!text) { showStatus('No JSON provided'); return; }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid JSON');
    await chrome.storage.local.set({ quicknav_settings: parsed });
    settings = parsed;
    await loadSettings();
    showStatus('Imported settings');
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (tab && tab.id) chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdated' }).catch(()=>{});
  } catch (e) {
    showStatus('Invalid JSON: ' + e.message);
  }
});

clearSiteBtn.addEventListener('click', async () => {
  if (!currentOrigin) return;
  const siteKey = currentOrigin;
  if (settings[siteKey]) {
    delete settings[siteKey];
    await chrome.storage.local.set({ quicknav_settings: settings });
    await loadSettings();
    showStatus('Site settings cleared');
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (tab && tab.id) chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdated' }).catch(()=>{});
  } else {
    showStatus('No settings for this site');
  }
});

document.addEventListener('DOMContentLoaded', loadSettings);
