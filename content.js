
(function () {
  const STORAGE_KEY = 'webgation_settings';

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
    
    const file = mode === 'floating' ? 'floating.js' : 'static.js';
    const url = chrome.runtime.getURL(file);
    
    removeInjectedUI();
    const s = document.createElement('script');
    s.src = url;
    s.id = 'webgation-injected-script';
    (document.head || document.documentElement).appendChild(s);
  }

  function removeInjectedUI() {
    const existingScript = document.getElementById('webgation-injected-script');
    if (existingScript) existingScript.remove();
    window.postMessage({ __webgation: true, type: 'destroyUI' }, '*');
  }

  function reportNavigation() {
    if (!isContextValid()) return;
    
    if (window.navigation && window.navigation.currentEntry) {
      const entry = window.navigation.currentEntry;
      chrome.runtime.sendMessage({
        type: 'report_nav',
        payload: {
          url: location.href,
          title: document.title,
          key: entry.key || entry.id
        }
      }).catch(() => { });
    }
  }

  if (window.navigation) {
    window.navigation.addEventListener('currententrychange', () => {
      setTimeout(reportNavigation, 50);
    });
  }

  window.addEventListener('message', async (ev) => {
    if (!isContextValid() || !ev.data || ev.source !== window || !ev.data.__webgation) return;
    
    const msg = ev.data;
    const siteKey = getSiteKey();
    
    try {
      if (msg.type === 'getSettings') {
        const settings = await loadSettings();
        const siteSettings = settings[siteKey] || { enabled: true, mode: 'static', position: null };
        window.postMessage({ __webgation: true, type: 'receiveSettings', payload: siteSettings }, '*');
      } 
      else if (msg.type === 'savePosition') {
        const settings = await loadSettings();
        settings[siteKey] = settings[siteKey] || { enabled: true, mode: 'static' };
        settings[siteKey].position = msg.payload;
        await chrome.storage.local.set({ [STORAGE_KEY]: settings });
      }
      else if (msg.type === 'openHome') {
        chrome.runtime.sendMessage({ type: 'open_new_tab' });
      }
      else if (msg.type === 'getHistory') {
        reportNavigation(); 
        
        chrome.runtime.sendMessage({ type: 'get_tab_history' }, (response) => {
          window.postMessage({ __webgation: true, type: 'receiveHistory', payload: response }, '*');
        });
      }
    } catch (e) {
      console.log("webgation: Connection lost (extension reloaded). Please refresh the page.");
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
    
    reportNavigation();

    const settings = await loadSettings();
    const siteSettings = settings[getSiteKey()] || { enabled: true, mode: 'static' };
    
    if (siteSettings.enabled) {
      injectModeScript(siteSettings.mode);
    } else {
      removeInjectedUI();
    }
  }

  window.addEventListener('pageshow', () => {
    reportNavigation();
  });

  init();
})();