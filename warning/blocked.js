const params = new URLSearchParams(location.search);
const rawUrl = params.get("u") || "";
const headline = params.get("h");
if (headline) document.getElementById("headline").textContent = headline;
document.getElementById("url").textContent = rawUrl || "Unknown address";

function httpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return "";
  }
  return "";
}

document.getElementById("back").addEventListener("click", () => {
  if (history.length > 1) history.back();
  else window.close();
});

document.getElementById("anyway").addEventListener("click", () => {
  const next = httpUrl(rawUrl);
  if (next) location.href = next;
});
