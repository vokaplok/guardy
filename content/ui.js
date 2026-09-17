const HOST_ID = "guardy-root";

const ICONS = {
  danger: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#C43131"/><rect x="28" y="14" width="8" height="24" rx="4" fill="#fff"/><circle cx="32" cy="48" r="4.5" fill="#fff"/></svg>`,
  caution: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 60 54H4L32 6z" fill="#C47B17"/><rect x="28" y="24" width="8" height="16" rx="4" fill="#fff"/><circle cx="32" cy="46" r="4" fill="#fff"/></svg>`,
  safe: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#0F7B4B"/><path d="M18 33.5 28 43.5 46 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function familyLine(settings) {
  if (settings.familyName && settings.familyPhone) {
    return `Call ${settings.familyName} at ${settings.familyPhone} if you want a second opinion.`;
  }
  if (settings.familyName) return `Ask ${settings.familyName} before you click anything.`;
  return "Ask someone you trust before you click, reply, or send money.";
}

export function renderPanel(result, settings) {
  const family = familyLine(settings);
  const findings = (result.findings || [])
    .slice(0, 4)
    .map(
      (item) => `<li>
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </li>`
    )
    .join("");

  const advice = (result.advice || []).map((tip) => `<p class="g-tip">${escapeHtml(tip)}</p>`).join("");

  const actions =
    result.level === "safe"
      ? `<button class="g-btn g-btn-quiet" data-g-act="dismiss">Hide for now</button>`
      : `<button class="g-btn g-btn-primary" data-g-act="leave">Close this and stay safe</button>
         <button class="g-btn g-btn-family" data-g-act="family">Copy a note for family</button>
         <button class="g-btn g-btn-quiet" data-g-act="details">Why we are worried</button>`;

  return `
    <div class="g-wrap g-${result.level}">
      <div class="g-icon">${ICONS[result.level]}</div>
      <div class="g-copy">
        <p class="g-kicker">Guardy is watching this page</p>
        <h1>${escapeHtml(result.headline)}</h1>
        <p class="g-summary">${escapeHtml(result.summary)}</p>
        <p class="g-family">${escapeHtml(family)}</p>
        <div class="g-actions">${actions}</div>
        <div class="g-details" hidden>
          <p class="g-details-title">Here is what we noticed</p>
          <ul>${findings || "<li>No extra details.</li>"}</ul>
          ${advice}
        </div>
      </div>
      <button class="g-x" data-g-act="dismiss" aria-label="Hide warning">×</button>
    </div>
  `;
}

export function panelStyles() {
  return `
    :host { all: initial; }
    .g-wrap {
      font-family: ui-rounded, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1b241c;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 18px;
      padding: 20px 22px;
      border-radius: 22px;
      box-shadow: 0 18px 50px rgba(18, 32, 22, 0.22);
      border: 3px solid transparent;
      animation: g-in .35s ease;
    }
    .g-wrap.g-danger { background: #fff5f3; border-color: #c43131; }
    .g-wrap.g-caution { background: #fff8eb; border-color: #c47b17; }
    .g-wrap.g-safe { background: #f1f8f3; border-color: #0f7b4b; }
    .g-icon svg { width: 64px; height: 64px; display: block; }
    .g-kicker {
      margin: 0 0 4px;
      font-size: 15px;
      letter-spacing: .04em;
      text-transform: uppercase;
      font-weight: 700;
      color: #5c675e;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.15;
      font-family: Georgia, "Iowan Old Style", serif;
    }
    .g-summary, .g-family, .g-tip, li span, .g-details-title {
      font-size: 20px;
      line-height: 1.4;
      margin: 0 0 10px;
    }
    .g-family { font-weight: 700; }
    .g-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 14px 0 4px; }
    .g-btn {
      border: 0;
      cursor: pointer;
      font-size: 18px;
      font-weight: 700;
      border-radius: 999px;
      padding: 12px 18px;
      min-height: 52px;
    }
    .g-btn-primary { background: #1b241c; color: #fff8eb; }
    .g-btn-family { background: #ead9a8; color: #1b241c; }
    .g-btn-quiet { background: transparent; color: #1b241c; text-decoration: underline; }
    .g-x {
      width: 44px; height: 44px; border: 0; background: transparent;
      font-size: 32px; cursor: pointer; color: #1b241c; line-height: 1;
    }
    .g-details { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,.12); }
    ul { margin: 0 0 12px; padding: 0 0 0 22px; }
    li { margin: 0 0 10px; font-size: 18px; }
    li strong { display: block; font-size: 20px; }
    @keyframes g-in { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
    @media (max-width: 720px) {
      .g-wrap { grid-template-columns: 1fr auto; }
      .g-icon { grid-column: 1; }
      h1 { font-size: 26px; }
    }
  `;
}

export function modalMarkup(result) {
  return `
    <div class="g-modal-scrim" data-g-act="stay">
      <div class="g-modal g-${result.level}" role="alertdialog" aria-modal="true" aria-labelledby="g-modal-title">
        <div class="g-icon">${ICONS.danger}</div>
        <h2 id="g-modal-title">Hold on. Do not tap that link.</h2>
        <p>${escapeHtml(result.headline)}. If this is a scam, clicking can let someone into your accounts.</p>
        <p class="g-family">Take a breath. You can close this window and nothing bad will happen.</p>
        <div class="g-actions">
          <button class="g-btn g-btn-primary" data-g-act="stay">Go back — stay safe</button>
          <button class="g-btn g-btn-quiet" data-g-act="proceed">I understand the risk</button>
        </div>
      </div>
    </div>
  `;
}

export function modalStyles() {
  return `
    .g-modal-scrim {
      position: fixed; inset: 0; background: rgba(12, 22, 16, .72);
      display: grid; place-items: center; padding: 24px; z-index: 2147483646;
    }
    .g-modal {
      max-width: 560px; width: min(560px, 100%);
      background: #fff7ef; color: #1b241c;
      border-radius: 28px; padding: 28px;
      border: 4px solid #c43131;
      font-family: ui-rounded, "Segoe UI", sans-serif;
    }
    .g-modal h2 { font-family: Georgia, serif; font-size: 32px; margin: 12px 0; line-height: 1.2; }
    .g-modal p { font-size: 20px; line-height: 1.4; }
    .g-icon svg { width: 72px; height: 72px; }
  `;
}

export function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) return host;
  host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.top = "12px";
  host.style.left = "50%";
  host.style.transform = "translateX(-50%)";
  host.style.zIndex = "2147483645";
  host.style.width = "min(920px, calc(100vw - 24px))";
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `${panelStyles()}\n${modalStyles()}\n.g-slot, .g-modal-slot { pointer-events: auto; }`;
  const slot = document.createElement("div");
  slot.className = "g-slot";
  const modalSlot = document.createElement("div");
  modalSlot.className = "g-modal-slot";
  shadow.append(style, slot, modalSlot);
  return host;
}

export function paintResult(result, settings) {
  const host = ensureHost();
  const slot = host.shadowRoot.querySelector(".g-slot");
  slot.innerHTML = renderPanel(result, settings);
  host.style.display = "block";
  return host;
}

export function paintModal(result) {
  const host = ensureHost();
  const modalSlot = host.shadowRoot.querySelector(".g-modal-slot");
  modalSlot.innerHTML = modalMarkup(result);
  return host;
}

export function hidePanel() {
  const host = document.getElementById(HOST_ID);
  if (host) host.style.display = "none";
}

export function hideModal() {
  const host = document.getElementById(HOST_ID);
  if (host) host.shadowRoot.querySelector(".g-modal-slot").innerHTML = "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
