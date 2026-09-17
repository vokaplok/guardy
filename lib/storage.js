const DEFAULTS = {
  largeText: true,
  pauseUntil: 0,
  homeBank: "",
  familyName: "",
  familyPhone: "",
  familyEmail: "",
  blockedCount: 0,
  scannedCount: 0,
  lastScan: null,
  recentAlerts: [],
  enabled: true,
};

export async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set(next);
  return next;
}

export async function recordScan(result) {
  const settings = await getSettings();
  const recentAlerts = [...(settings.recentAlerts || [])];
  if (result.level !== "safe") {
    recentAlerts.unshift({
      level: result.level,
      headline: result.headline,
      preview: result.preview,
      at: result.scannedAt,
    });
  }
  const patch = {
    scannedCount: (settings.scannedCount || 0) + 1,
    lastScan: result,
    recentAlerts: recentAlerts.slice(0, 12),
  };
  if (result.level === "danger") {
    patch.blockedCount = (settings.blockedCount || 0) + 1;
  }
  return saveSettings(patch);
}

export function isPaused(settings) {
  return Boolean(settings.pauseUntil && Date.now() < settings.pauseUntil);
}
