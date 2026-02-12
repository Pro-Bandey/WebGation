const tabHistory = {};

function handleNavigationUpdate(tabId, info) {
  if (!tabHistory[tabId]) {
    tabHistory[tabId] = { stack: [], currentIdx: -1 };
  }
  const h = tabHistory[tabId];
  const { url, title, key } = info;

  const existingIndex = h.stack.findIndex(entry => entry.key === key);

  if (existingIndex !== -1) {
    h.currentIdx = existingIndex;
    
    h.stack[existingIndex].url = url;
    if (title) h.stack[existingIndex].title = title;
  } else {
    if (h.currentIdx < h.stack.length - 1) {
      h.stack = h.stack.slice(0, h.currentIdx + 1);
    }
    h.stack.push({ url, title: title || url, key });
    h.currentIdx = h.stack.length - 1;
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabHistory[tabId]) delete tabHistory[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.title && tabHistory[tabId]) {
    const h = tabHistory[tabId];
    if (h.currentIdx >= 0 && h.stack[h.currentIdx]) {
      if (h.stack[h.currentIdx].url === tab.url) {
        h.stack[h.currentIdx].title = changeInfo.title;
      }
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'close-tab') {
    if (sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id, () => {
        sendResponse({ ok: true });
      });
      return true;
    } else {
      sendResponse({ ok: false, error: 'no-tab' });
    }
  }
  
  if (msg && msg.type === 'report_nav') {
    if (sender.tab && sender.tab.id) {
      handleNavigationUpdate(sender.tab.id, msg.payload);
    }
  }

  if (msg && msg.type === 'get_tab_history') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId) {
      if (!tabHistory[tabId]) {
         tabHistory[tabId] = { stack: [], currentIdx: -1 };
      }
      sendResponse(tabHistory[tabId]);
    } else {
      sendResponse({ stack: [], currentIdx: -1 });
    }
    return true; 
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'open_new_tab') {
    chrome.tabs.create({});
  }
});

const INSTALL_URL = "https://github.com/Pro-Bandey/WebGation/wiki/";
const UNINSTALL_URL = "https://github.com/Pro-Bandey/WebGation/issues/new/choose/";

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: INSTALL_URL, active: true }).catch(console.warn);
  }
  chrome.runtime.setUninstallURL(UNINSTALL_URL).catch((err) => {
    console.warn("Could not set uninstall URL:", err);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.runtime.setUninstallURL(UNINSTALL_URL).catch(() => { });
});