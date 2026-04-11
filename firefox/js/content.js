const extApi = typeof browser !== "undefined" ? browser : chrome;


(function () {
  const STORAGE_KEY = 'webgation_settings';

  function isContextValid() {
    return !!extApi.runtime?.id;
  }

  async function loadSettings() {
    if (!isContextValid()) return {}; 
    try {
      const data = await extApi.storage.local.get(STORAGE_KEY);
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
    
    const file = mode === 'floating' ? 'js/floating.js' : 'js/static.js';
    const url = extApi.runtime.getURL(file);
    
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
      extApi.runtime.sendMessage({
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
        const siteSettings = settings[siteKey] || { enabled: true, mode: 'floating', position: null };
        window.postMessage({ __webgation: true, type: 'receiveSettings', payload: siteSettings }, '*');
      } 
      else if (msg.type === 'savePosition') {
        const settings = await loadSettings();
        settings[siteKey] = settings[siteKey] || { enabled: true, mode: 'floating' };
        settings[siteKey].position = msg.payload;
        await extApi.storage.local.set({ [STORAGE_KEY]: settings });
      }
      else if (msg.type === 'openHome') {
        extApi.runtime.sendMessage({ type: 'open_new_tab' });
      }
      else if (msg.type === 'getHistory') {
        reportNavigation(); 
        
        extApi.runtime.sendMessage({ type: 'get_tab_history' }, (response) => {
          window.postMessage({ __webgation: true, type: 'receiveHistory', payload: response }, '*');
        });
      }
    } catch (e) {
      console.log("webgation: Connection lost (extension reloaded). Please refresh the page.");
    }
  });

  if (isContextValid()) {
    extApi.runtime.onMessage.addListener((message) => {
      if (isContextValid() && message.type === 'settingsUpdated') {
        init();
      }
    });
  }

  async function init() {
    if (!isContextValid()) return;
    
    reportNavigation();

    const settings = await loadSettings();
    const siteSettings = settings[getSiteKey()] || { enabled: true, mode: 'floating' };
    
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