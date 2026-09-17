import { analyzeUrl } from "../lib/detector.js";
import { getSettings, saveSettings, recordScan, isPaused } from "../lib/storage.js";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await saveSettings({ enabled: true });
    chrome.tabs.create({ url: chrome.runtime.getURL("options/options.html?welcome=1") });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handle(message, sender).then(sendResponse).catch((error) => {
    sendResponse({ error: String(error) });
  });
  return true;
});

async function handle(message, sender) {
  if (message.type === "get-settings") return getSettings();
  if (message.type === "save-settings") return saveSettings(message.patch || {});
  if (message.type === "scan-complete") {
    const saved = await recordScan(message.result);
    await updateBadge(message.result);
    if (message.result.level === "danger" && message.reason !== "mutation") {
      maybeNotify(message.result);
    }
    return saved;
  }
  if (message.type === "close-or-home") {
    if (sender.tab?.id) {
      chrome.tabs.update(sender.tab.id, { url: "chrome://newtab/" }).catch(() => {
        chrome.tabs.remove(sender.tab.id);
      });
    }
    return { ok: true };
  }
  if (message.type === "copied-family-note") {
    return { ok: true };
  }
  if (message.type === "scan-active-tab") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: "No tab" };
    return chrome.tabs.sendMessage(tab.id, { type: "scan-now" }).catch(() => ({
      error: "This page cannot be scanned. Try Gmail, Outlook, Yahoo Mail, or an ordinary website.",
    }));
  }
  return { error: "unknown" };
}

async function updateBadge(result) {
  const color = result.level === "danger" ? "#C43131" : result.level === "caution" ? "#C47B17" : "#0F7B4B";
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text: result.level === "safe" ? "" : "!" });
  await chrome.action.setTitle({
    title: result.headline || "Guardy",
  });
}

let lastNotice = 0;
async function maybeNotify(result) {
  const settings = await getSettings();
  if (!settings.enabled || isPaused(settings)) return;
  if (Date.now() - lastNotice < 15000) return;
  lastNotice = Date.now();
  chrome.notifications.create(`guardy-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "Guardy stopped you for a moment",
    message: result.headline,
    priority: 2,
  });
}

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0 || details.transitionType === "reload") return;
  const settings = await getSettings();
  if (!settings.enabled || isPaused(settings)) return;
  const result = analyzeUrl(details.url);
  if (result.level === "danger" && result.findings.some((f) => f.id === "lookalike-site")) {
    const target = chrome.runtime.getURL(
      `warning/blocked.html?u=${encodeURIComponent(details.url)}&h=${encodeURIComponent(result.headline)}`
    );
    chrome.tabs.update(details.tabId, { url: target });
    await recordScan(result);
    await updateBadge(result);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "scan-page") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "scan-now" });
  }
});
