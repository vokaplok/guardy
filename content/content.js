import { analyze } from "../lib/detector.js";
import { extractEmail, extractGenericPage, isMailHost } from "./extract.js";
import { paintResult, paintModal, hidePanel, hideModal } from "./ui.js";

let lastFingerprint = "";
let lastResult = null;
let settingsCache = null;
let allowOnce = new WeakSet();
let panelBound = false;
let hideTimer = 0;

async function settings() {
  if (settingsCache) return settingsCache;
  try {
    settingsCache = await chrome.runtime.sendMessage({ type: "get-settings" });
  } catch {
    settingsCache = { enabled: true };
  }
  return settingsCache || { enabled: true };
}

chrome.storage.onChanged.addListener(() => {
  settingsCache = null;
});

function fingerprint(payload) {
  return JSON.stringify({
    s: payload.subject,
    e: payload.senderEmail,
    t: (payload.body || "").slice(0, 400),
    u: payload.pageUrl,
  });
}

async function scan(reason = "auto") {
  const cfg = await settings();
  if (!cfg?.enabled) return null;
  if (cfg.pauseUntil && Date.now() < cfg.pauseUntil) return null;

  const email = extractEmail();
  if (isMailHost() && !email && reason !== "manual") return null;

  const page = extractGenericPage();
  const payload = {
    ...(page || {}),
    ...(email || {}),
    homeBank: cfg.homeBank || "",
    source: email?.source || "page",
  };

  if (!payload.body && !payload.subject && !payload.hasPasswordField) {
    if (reason !== "manual") return null;
  }

  const fp = fingerprint(payload);
  if (reason !== "manual" && fp === lastFingerprint && lastResult) {
    return lastResult;
  }

  const result = analyze(payload);
  lastFingerprint = fp;
  lastResult = result;

  try {
    await chrome.runtime.sendMessage({ type: "scan-complete", result, reason });
  } catch {
    // Extension was reloaded while this tab stayed open.
  }

  if (result.level === "safe" && reason !== "manual" && !email) {
    hidePanel();
    return result;
  }

  window.clearTimeout(hideTimer);
  const host = paintResult(result, cfg);
  bindPanel(host);
  if (result.level === "safe" && reason !== "manual") {
    hideTimer = window.setTimeout(() => hidePanel(), 8000);
  }
  if (email && result.level !== "safe") wrapDangerousLinks(result);
  return result;
}

function bindPanel(host) {
  if (panelBound) return;
  panelBound = true;
  host.shadowRoot.addEventListener("click", async (event) => {
    const act = event.target.closest("[data-g-act]")?.dataset.gAct;
    if (!act) return;
    const cfg = await settings();
    const result = lastResult;
    if (act === "dismiss") hidePanel();
    if (act === "leave") {
      if (isMailHost()) history.back();
      else chrome.runtime.sendMessage({ type: "close-or-home" });
    }
    if (act === "details") {
      const box = host.shadowRoot.querySelector(".g-details");
      if (box) box.hidden = !box.hidden;
    }
    if (act === "family" && result) {
      const note = familyNote(result, cfg);
      await navigator.clipboard.writeText(note).catch(() => {});
      chrome.runtime.sendMessage({ type: "copied-family-note" });
      event.target.textContent = "Note copied — paste it in a text";
    }
  });
}

function familyNote(result, cfg) {
  const who = cfg.familyName ? `Hi ${cfg.familyName}, ` : "Hi, ";
  const findings = (result.findings || []).slice(0, 3).map((f) => `• ${f.title}`).join("\n");
  return `${who}Guardy flagged something I was looking at.\n\n${result.headline}\n${result.summary}\n\n${findings}\n\nPage: ${location.href}\n\nI have not clicked anything. Can you take a look?`;
}

function wrapDangerousLinks(result) {
  const root =
    document.querySelector(".a3s.aiL") ||
    document.querySelector('[aria-label="Message body"]') ||
    document.querySelector("[data-test-id='message-view-body']") ||
    document.body;
  root.querySelectorAll("a[href]").forEach((anchor) => {
    if (anchor.dataset.guardyBound) return;
    anchor.dataset.guardyBound = "1";
    anchor.addEventListener(
      "click",
      (event) => {
        if (allowOnce.has(anchor)) return;
        if (result.level === "safe") return;
        event.preventDefault();
        event.stopPropagation();
        const host = paintModal(result);
        host.shadowRoot.querySelector(".g-modal-slot").onclick = (inner) => {
          const act = inner.target.closest("[data-g-act]")?.dataset.gAct;
          if (act === "stay") hideModal();
          if (act === "proceed") {
            allowOnce.add(anchor);
            hideModal();
            anchor.click();
          }
        };
      },
      true
    );
  });
}

document.addEventListener(
  "submit",
  async (event) => {
    const cfg = await settings();
    if (!cfg?.enabled) return;
    if (
      lastResult?.level === "danger" &&
      event.target instanceof HTMLFormElement &&
      event.target.querySelector("input[type='password']")
    ) {
      event.preventDefault();
      paintModal(lastResult);
    }
  },
  true
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "scan-now") {
    scan("manual").then((result) => sendResponse(result || lastResult));
    return true;
  }
  if (message.type === "current-result") {
    sendResponse(lastResult);
  }
  return false;
});

const observer = new MutationObserver(() => {
  window.clearTimeout(observer.t);
  observer.t = window.setTimeout(() => scan("mutation"), 400);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

if (document.readyState === "complete") scan("load");
else window.addEventListener("load", () => scan("load"));
