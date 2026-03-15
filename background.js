const INSTALL_URL = "https://github.com/Pro-Bandey/WebGation/wiki/";
const UNINSTALL_URL = "https://github.com/Pro-Bandey/WebGation/issues/new/choose/";

const tabHistory = {};

// Helper function to keep code DRY when initializing state
const getOrCreateTabHistory = (tabId) => {
  if (!tabHistory[tabId]) {
    tabHistory[tabId] = { stack:[], currentIdx: -1 };
  }
  return tabHistory[tabId];
};

function handleNavigationUpdate(tabId, info) {
  const h = getOrCreateTabHistory(tabId);
  const { url, title, key } = info;

  const existingIndex = h.stack.findIndex(entry => entry.key === key);

  if (existingIndex !== -1) {
    h.currentIdx = existingIndex;
    h.stack[existingIndex].url = url;
    if (title) h.stack[existingIndex].title = title;
  } else {
    // Truncate forward history efficiently by setting array length 
    // instead of allocating a new array using .slice()
    if (h.currentIdx < h.stack.length - 1) {
      h.stack.length = h.currentIdx + 1;
    }
    h.stack.push({ url, title: title || url, key });
    h.currentIdx = h.stack.length - 1;
  }
}

// --- Tab Events ---

chrome.tabs.onRemoved.addListener((tabId) => {
  // `delete` is completely safe and won't throw an error even if the key doesn't exist
  delete tabHistory[tabId];
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.title || !tabHistory[tabId]) return; // Early exit reduces nesting

  const h = tabHistory[tabId];
  const currentEntry = h.stack[h.currentIdx];

  if (currentEntry && currentEntry.url === tab.url) {
    currentEntry.title = changeInfo.title;
  }
});

// --- Message Handling ---

// Combined both onMessage listeners into a single clean switch statement
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;

  const tabId = sender.tab?.id; // Optional chaining for cleaner extraction

  switch (msg.type) {
    case 'close-tab':
      if (tabId) {
        chrome.tabs.remove(tabId, () => sendResponse({ ok: true }));
        return true; // Keeps the channel open for the async callback
      }
      sendResponse({ ok: false, error: 'no-tab' });
      break;

    case 'report_nav':
      if (tabId) handleNavigationUpdate(tabId, msg.payload);
      break;

    case 'get_tab_history':
      if (tabId) {
        sendResponse(getOrCreateTabHistory(tabId));
      } else {
        sendResponse({ stack:[], currentIdx: -1 });
      }
      break;

    case 'open_new_tab':
      chrome.tabs.create({});
      break;
  }
});

// --- Lifecycle Events ---

const setupUninstallUrl = () => {
  chrome.runtime.setUninstallURL(UNINSTALL_URL, () => {
    if (chrome.runtime.lastError) {
      console.warn("Could not set uninstall URL:", chrome.runtime.lastError);
    }
  });
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: INSTALL_URL, active: true });
  }
  setupUninstallUrl();
});

chrome.runtime.onStartup.addListener(() => {
  setupUninstallUrl();
});