function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function timeAgo(ts) {
  if (!ts) return "";
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 minute ago";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}

async function refresh() {
  let settings;
  try {
    settings = await chrome.runtime.sendMessage({ type: "get-settings" });
  } catch {
    settings = null;
  }
  if (!settings || settings.error) return;

  $("scanned").textContent = settings.scannedCount || 0;
  $("blocked").textContent = settings.blockedCount || 0;

  if (settings.familyName) {
    const phone = settings.familyPhone ? ` at ${settings.familyPhone}` : "";
    $("family-line").textContent = `Call ${settings.familyName}${phone} before you change any banking information.`;
  }

  const result = settings.lastScan;
  const status = $("status");
  if (result) {
    status.className = `status ${result.level}`;
    $("headline").textContent = result.headline;
    $("summary").textContent = result.summary;
  }

  const alerts = $("alerts");
  alerts.innerHTML = (settings.recentAlerts || [])
    .slice(0, 4)
    .map((item) => `<li>
      <b>${escapeHtml(item.headline)}</b>
      <span>${escapeHtml(item.preview?.sender || "Unknown sender")} · ${escapeHtml(timeAgo(item.at))}</span>
    </li>`)
    .join("");
}

$("scan").addEventListener("click", async () => {
  $("headline").textContent = "Looking carefully…";
  $("summary").textContent = "I am checking this page for fake links, rushed language, and banking-change tricks.";
  const result = await chrome.runtime.sendMessage({ type: "scan-active-tab" }).catch((error) => ({
    error: String(error.message || error),
  }));
  if (result?.error) {
    $("status").className = "status idle";
    $("headline").textContent = "I cannot see this page";
    $("summary").textContent = result.error;
    return;
  }
  await refresh();
});

$("practice").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("demo/samples.html") });
});

refresh();
