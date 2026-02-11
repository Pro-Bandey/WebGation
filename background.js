const INSTALL_URL = "https://github.com/Pro-Bandey/WebGation/wiki/";
const UNINSTALL_URL = "https://github.com/Pro-Bandey/WebGation/issues/new/choose/";

// --- HISTORY TRACKING START ---
const tabHistory = {}; // { tabId: { stack: [], currentIndex: -1 } }

// Helper to push history
function updateHistory(tabId, url, type, qualifiers) {
  if (!tabHistory[tabId]) tabHistory[tabId] = { stack: [], currentIndex: -1 };
  const data = tabHistory[tabId];

  // If this is a reload, ignore
  if (type === 'reload') return;

  // Heuristic for Back/Forward actions
  const isBack = qualifiers.includes('back');
  const isForward = qualifiers.includes('forward');

  if (isBack) {
    data.currentIndex = Math.max(0, data.currentIndex - 1);
  } else if (isForward) {
    data.currentIndex = Math.min(data.stack.length - 1, data.currentIndex + 1);
  } else {
    // New navigation: Truncate future history and push new
    // Don't duplicate if it's the exact same URL at current index (rare reload edge case)
    const currentEntry = data.stack[data.currentIndex];
    if (!currentEntry || currentEntry.url !== url) {
      data.stack = data.stack.slice(0, data.currentIndex + 1);
      data.stack.push({ url: url, title: url }); // Title updated later
      data.currentIndex++;
    }
  }
}

// Ensure chrome.webNavigation is available (requires permission in manifest)
if (chrome.webNavigation) {
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) { // Top-level frame only
      updateHistory(details.tabId, details.url, details.transitionType, details.transitionQualifiers);
    }
  });
  // Also catch SPA history changes
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId === 0) {
      updateHistory(details.tabId, details.url, details.transitionType, details.transitionQualifiers);
    }
  });
}

// Update titles when they load
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.title && tabHistory[tabId]) {
    const data = tabHistory[tabId];
    if (data.stack[data.currentIndex]) {
      data.stack[data.currentIndex].title = changeInfo.title;
    }
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabHistory[tabId];
});
// --- HISTORY TRACKING END ---

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

  // NEW: Handle history request
  if (msg && msg.type === 'get_tab_history') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId && tabHistory[tabId]) {
      sendResponse(tabHistory[tabId]);
    } else {
      sendResponse({ stack: [], currentIndex: -1 });
    }
    return true; // async response
  }

  if (msg.type === 'open_new_tab') {
    chrome.tabs.create({});
  }
});

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