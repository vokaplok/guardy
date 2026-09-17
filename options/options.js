const fields = ["familyName", "familyPhone", "homeBank"];

function $(id) {
  return document.getElementById(id);
}

if (new URLSearchParams(location.search).get("welcome")) {
  $("welcome-kicker").textContent = "Welcome";
  $("title").textContent = "You are not alone on the internet";
}

const settings = await chrome.runtime.sendMessage({ type: "get-settings" });
for (const name of fields) $(name).value = settings[name] || "";
$("enabled").checked = settings.enabled !== false;

$("save").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "save-settings",
    patch: {
      familyName: $("familyName").value.trim(),
      familyPhone: $("familyPhone").value.trim(),
      homeBank: $("homeBank").value.trim(),
      enabled: $("enabled").checked,
    },
  });
  $("saved").hidden = false;
});

$("pause").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "save-settings",
    patch: { pauseUntil: Date.now() + 15 * 60 * 1000 },
  });
  $("pause").textContent = "Paused for 15 minutes";
});
