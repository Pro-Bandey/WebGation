
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'open_new_tab') {
    chrome.tabs.create({});
  }
  return false;
});