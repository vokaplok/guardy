function attr(el, name) {
  return el?.getAttribute?.(name) || "";
}

function visible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function collectLinks(root) {
  return [...root.querySelectorAll("a[href]")].slice(0, 80).map((a) => ({
    text: (a.innerText || a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180),
    href: a.href || attr(a, "href"),
  }));
}

function firstText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && (el.innerText || "").trim()) return el.innerText.trim();
  }
  return "";
}

export function extractGmail() {
  const subject = firstText(["h2.hP", "h2[data-legacy-thread-id]", ".ha h2"]);
  const senderEl =
    document.querySelector("span.gD[email]") ||
    document.querySelector(".gD") ||
    document.querySelector("span[email]");
  const bodyEl =
    document.querySelector(".a3s.aiL") ||
    document.querySelector("div.a3s") ||
    document.querySelector(".ii.gt");
  if (!subject && !bodyEl) return null;
  return {
    source: "gmail",
    subject,
    senderName: (senderEl?.innerText || "").trim(),
    senderEmail: attr(senderEl, "email") || "",
    body: (bodyEl?.innerText || "").slice(0, 20000),
    links: bodyEl ? collectLinks(bodyEl) : [],
  };
}

export function extractOutlook() {
  const subject = firstText([
    '[role="heading"][aria-level="2"]',
    "div[data-app-section='ConversationSubject']",
    ".allowTextSelection h2",
  ]);
  const senderEl =
    document.querySelector('[aria-label*="From"] span') ||
    document.querySelector("span.OZZZK") ||
    document.querySelector("div[data-log-name='Sender']");
  const bodyEl =
    document.querySelector('[aria-label="Message body"]') ||
    document.querySelector("#UniqueMessageBody") ||
    document.querySelector("div[data-app-section='MessageBody']") ||
    document.querySelector(".allowTextSelection div[role='document']");
  if (!bodyEl && !subject) return null;
  const senderText = (senderEl?.innerText || "").trim();
  const emailMatch = senderText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return {
    source: "outlook",
    subject,
    senderName: senderText,
    senderEmail: emailMatch ? emailMatch[0] : "",
    body: (bodyEl?.innerText || "").slice(0, 20000),
    links: bodyEl ? collectLinks(bodyEl) : [],
  };
}

export function extractYahoo() {
  const subject = firstText([".thread-subject", "span[data-test-id='message-subject']", "h1"]);
  const senderEl =
    document.querySelector("[data-test-id='message-from']") ||
    document.querySelector(".from");
  const bodyEl =
    document.querySelector("[data-test-id='message-view-body']") ||
    document.querySelector(".msg-body") ||
    document.querySelector("#mail-app-component div[dir='ltr']");
  if (!bodyEl && !subject) return null;
  const senderText = (senderEl?.innerText || "").trim();
  const emailMatch = senderText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return {
    source: "yahoo",
    subject,
    senderName: senderText,
    senderEmail: emailMatch ? emailMatch[0] : "",
    body: (bodyEl?.innerText || "").slice(0, 20000),
    links: bodyEl ? collectLinks(bodyEl) : [],
  };
}

export function extractGenericPage() {
  const main =
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.querySelector("[role='main']") ||
    document.body;
  const forms = [...document.querySelectorAll("form")];
  const hasPasswordField = Boolean(
    document.querySelector("input[type='password'], input[name*='pass' i], input[autocomplete='current-password']")
  );
  return {
    source: "page",
    subject: "",
    senderName: "",
    senderEmail: "",
    body: (main?.innerText || "").slice(0, 15000),
    links: collectLinks(document.body),
    pageUrl: location.href,
    pageTitle: document.title,
    hasPasswordField,
    hasForms: forms.length > 0,
  };
}

export function extractEmail() {
  const host = location.hostname;
  if (host.includes("mail.google.com")) return extractGmail();
  if (host.includes("outlook.live.com") || host.includes("outlook.office.com") || host.includes("outlook.office365.com")) {
    return extractOutlook();
  }
  if (host.includes("mail.yahoo.com")) return extractYahoo();
  return null;
}

export function isMailHost(host = location.hostname) {
  return (
    host.includes("mail.google.com") ||
    host.includes("outlook.live.com") ||
    host.includes("outlook.office.com") ||
    host.includes("outlook.office365.com") ||
    host.includes("mail.yahoo.com")
  );
}

export { visible };
