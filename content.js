
(function () {
  const STORAGE_KEY = 'quicknav_settings';

  function isContextValid() {
    return !!chrome.runtime?.id;
  }

  async function loadSettings() {
    if (!isContextValid()) return {}; 
    try {
      const data = await chrome.storage.local.get(STORAGE_KEY);
      return data[STORAGE_KEY] || {};
    } catch (e) {
      return {}; 
    }
  }

  function getSiteKey() {
    try {
      return location.origin;
    } catch (e) {
      return 'unknown';
    }
  }

  function injectModeScript(mode) {
    if (!isContextValid()) return;
    
    const file = mode === 'static' ? 'static.js' : 'floating.js';
    const url = chrome.runtime.getURL(file);
    
    removeInjectedUI();
    const s = document.createElement('script');
    s.src = url;
    s.id = 'quicknav-injected-script';
    (document.head || document.documentElement).appendChild(s);
  }

  function removeInjectedUI() {
    const existingScript = document.getElementById('quicknav-injected-script');
    if (existingScript) existingScript.remove();
    window.postMessage({ __quicknav: true, type: 'destroyUI' }, '*');
  }

  window.addEventListener('message', async (ev) => {
    if (!isContextValid() || !ev.data || ev.source !== window || !ev.data.__quicknav) return;
    
    const msg = ev.data;
    const siteKey = getSiteKey();
    
    try {
      if (msg.type === 'getSettings') {
        const settings = await loadSettings();
        const siteSettings = settings[siteKey] || { enabled: true, mode: 'floating', position: null };
        window.postMessage({ __quicknav: true, type: 'receiveSettings', payload: siteSettings }, '*');
      } 
      else if (msg.type === 'savePosition') {
        const settings = await loadSettings();
        settings[siteKey] = settings[siteKey] || { enabled: true, mode: 'floating' };
        settings[siteKey].position = msg.payload;
        await chrome.storage.local.set({ [STORAGE_KEY]: settings });
      }
      else if (msg.type === 'openHome') {
        chrome.runtime.sendMessage({ type: 'open_new_tab' });
      }
    } catch (e) {
      console.log("QuickNav: Connection lost (extension reloaded). Please refresh the page.");
    }
  });

  if (isContextValid()) {
    chrome.runtime.onMessage.addListener((message) => {
      if (isContextValid() && message.type === 'settingsUpdated') {
        init();
      }
    });
  }

  async function init() {
    if (!isContextValid()) return;
    const settings = await loadSettings();
    const siteSettings = settings[getSiteKey()] || { enabled: true, mode: 'floating' };
    
    if (siteSettings.enabled) {
      injectModeScript(siteSettings.mode);
    } else {
      removeInjectedUI();
    }
  }

  init();
})();