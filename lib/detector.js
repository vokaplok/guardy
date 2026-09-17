import {
  BRANDS,
  FREE_EMAIL_DOMAINS,
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  hostnameOf,
  registrableDomain,
  findBrandForText,
  brandOwnsDomain,
  findLookalikeBrand,
} from "./brands.js";
import { PATTERNS, LINK_TEXT_HINTS } from "./patterns.js";

const DANGER = 70;
const CAUTION = 32;

function addFinding(findings, finding) {
  if (!finding) return;
  if (findings.some((item) => item.id === finding.id)) {
    const existing = findings.find((item) => item.id === finding.id);
    existing.weight = Math.max(existing.weight, finding.weight);
    if (finding.extra) existing.extra = finding.extra;
    return;
  }
  findings.push(finding);
}

function textBlob(input) {
  return [input.subject, input.senderName, input.senderEmail, input.body, input.pageTitle]
    .filter(Boolean)
    .join("\n");
}

function analyzePatterns(blob, findings) {
  for (const rule of Object.values(PATTERNS)) {
    if (rule.tests.some((re) => re.test(blob))) {
      addFinding(findings, {
        id: rule.id,
        severity: rule.weight >= 35 ? "danger" : "caution",
        title: rule.title,
        detail: rule.detail,
        weight: rule.weight,
      });
    }
  }
}

function analyzeSender(input, findings) {
  const email = (input.senderEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  const domain = email.split("@").pop();
  const display = `${input.senderName || ""} ${input.subject || ""} ${input.body || ""}`;
  const brand = findBrandForText(display) || findBrandForText(input.senderName || "");

  if (brand && !brandOwnsDomain(brand, domain)) {
    const free = FREE_EMAIL_DOMAINS.has(domain);
    addFinding(findings, {
      id: "brand-impersonation",
      severity: "danger",
      title: `It pretends to be ${brand.name}, but it is not`,
      detail: free
        ? `The name says ${brand.name}, yet the email comes from a free mailbox (@${domain}). Real ${brand.name} messages come from ${brand.domains[0]}.`
        : `The name says ${brand.name}, but the email address uses ${domain} instead of ${brand.domains[0]}. This is a common trick.`,
      weight: 40,
      extra: { brand: brand.name, domain },
    });
  }

  if (input.replyTo) {
    const replyDomain = input.replyTo.split("@").pop()?.toLowerCase();
    if (replyDomain && replyDomain !== domain) {
      addFinding(findings, {
        id: "reply-to-mismatch",
        severity: "caution",
        title: "Replies would go to a different address",
        detail: `Messages from ${email} ask you to reply to ${input.replyTo}. Scammers do this so they receive your answer.`,
        weight: 16,
      });
    }
  }
}

function suspiciousHref(href) {
  if (!href) return null;
  const trimmed = href.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return { reason: "hidden-script", label: "This link tries to run a hidden action instead of opening a real website." };
  }
  if (/^mailto:/i.test(trimmed)) return null;
  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.username || url.password || trimmed.includes("@") && /^https?:/i.test(trimmed)) {
    if (trimmed.split("/").slice(0, 3).join("/").includes("@")) {
      return { reason: "at-sign", label: "This link hides the real website after an @ sign — a classic scam trick." };
    }
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { reason: "ip-url", label: "This link goes to a raw number address, not a company website." };
  }
  if (host.includes("xn--")) {
    return { reason: "punycode", label: "This web address uses disguised letters. It may only look like a brand you know." };
  }
  if (URL_SHORTENERS.has(host)) {
    return { reason: "shortener", label: "This is a shortened link. You cannot see the real destination before you click." };
  }
  const tld = host.split(".").pop();
  if (SUSPICIOUS_TLDS.has(tld)) {
    return { reason: "odd-tld", label: `This website ends in .${tld}, which scammers often use for fake pages.` };
  }
  const lookalike = findLookalikeBrand(host);
  if (lookalike) {
    return {
      reason: "lookalike",
      label: `This link looks like ${lookalike.brand.name} but actually goes to ${host}. The real site is ${lookalike.official}.`,
      lookalike,
    };
  }
  return null;
}

function displayHost(text) {
  const match = (text || "").match(/\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i);
  return match ? hostnameOf(match[1]) : "";
}

function analyzeLinks(input, findings) {
  const links = input.links || [];
  const bad = [];
  for (const link of links) {
    const href = link.href || "";
    const text = (link.text || "").trim();
    const issue = suspiciousHref(href);
    if (issue) {
      bad.push({ href, text, issue });
      continue;
    }
    const shown = displayHost(text);
    const actual = hostnameOf(href);
    if (shown && actual && registrableDomain(shown) !== registrableDomain(actual)) {
      bad.push({
        href,
        text,
        issue: {
          reason: "mismatch",
          label: `The words say ${shown}, but the link goes to ${actual}.`,
        },
      });
    } else if (LINK_TEXT_HINTS.test(text) && href) {
      const host = hostnameOf(href);
      const blob = textBlob(input);
      const brand = findBrandForText(blob);
      if (brand && host && !brandOwnsDomain(brand, host)) {
        bad.push({
          href,
          text,
          issue: {
            reason: "brand-link",
            label: `A “${text}” button does not go to ${brand.name}. It goes to ${host}.`,
          },
        });
      }
    }
  }

  if (bad.length) {
    const lookalike = bad.find((item) => item.issue.reason === "lookalike" || item.issue.reason === "mismatch" || item.issue.reason === "brand-link");
    addFinding(findings, {
      id: "suspicious-links",
      severity: lookalike ? "danger" : "caution",
      title: bad.length === 1 ? "A link in this message is suspicious" : `${bad.length} links in this message are suspicious`,
      detail: bad.slice(0, 3).map((item) => item.issue.label).join(" "),
      weight: lookalike ? 36 : 20,
      extra: { links: bad.slice(0, 8) },
    });
  }
}

function analyzePage(input, findings) {
  const host = hostnameOf(input.pageUrl || "");
  if (!host) return;
  const lookalike = findLookalikeBrand(host);
  if (lookalike) {
    addFinding(findings, {
      id: "lookalike-site",
      severity: "danger",
      title: `This website is pretending to be ${lookalike.brand.name}`,
      detail: `You are on ${host}. The real ${lookalike.brand.name} website is ${lookalike.official}. Do not type a password here.`,
      weight: 48,
      extra: lookalike,
    });
  }

  const blob = textBlob(input);
  const brand = findBrandForText(blob) || findBrandForText(input.pageTitle || "");
  const hasPassword = Boolean(input.hasPasswordField);
  if (brand && hasPassword && !brandOwnsDomain(brand, host)) {
    addFinding(findings, {
      id: "fake-login",
      severity: "danger",
      title: `This is not the real ${brand.name} sign-in page`,
      detail: `The page asks for a password and mentions ${brand.name}, but the address is ${host}. Close it and open ${brand.domains[0]} yourself by typing it in.`,
      weight: 50,
    });
  }

  if (input.pageUrl && /^http:\/\//i.test(input.pageUrl) && hasPassword) {
    addFinding(findings, {
      id: "insecure-login",
      severity: "danger",
      title: "This sign-in page is not secure",
      detail: "The address starts with http, not https. Your password could be stolen. Do not sign in.",
      weight: 34,
    });
  }
}

function analyzeCustomBank(input, findings) {
  const bank = (input.homeBank || "").trim();
  if (!bank || bank.length < 3) return;
  const blob = textBlob(input).toLowerCase();
  if (!blob.includes(bank.toLowerCase())) return;
  const host = hostnameOf(input.pageUrl || "") || (input.senderEmail || "").split("@")[1] || "";
  const brand = BRANDS.find((item) => item.name.toLowerCase() === bank.toLowerCase())
    || findBrandForText(bank);
  if (brand && host && !brandOwnsDomain(brand, host) && !FREE_EMAIL_DOMAINS.has(host)) {
    addFinding(findings, {
      id: "home-bank-mismatch",
      severity: "danger",
      title: `This is not from your bank (${bank})`,
      detail: `You told Guardy that you bank with ${bank}. This message or page does not come from their real website.`,
      weight: 36,
    });
  }
}

function scoreOf(findings) {
  const sorted = [...findings].sort((a, b) => b.weight - a.weight);
  let score = 0;
  sorted.forEach((finding, index) => {
    const decay = Math.max(0.4, 1 - index * 0.12);
    score += finding.weight * decay;
  });
  return Math.min(100, Math.round(score));
}

function levelOf(score, findings) {
  if (findings.some((f) => f.id === "banking-change" || f.id === "fake-login" || f.id === "lookalike-site") && score >= 40) {
    return "danger";
  }
  if (score >= DANGER) return "danger";
  if (score >= CAUTION) return "caution";
  return "safe";
}

function headlineFor(level, findings) {
  if (level === "danger") {
    if (findings.some((f) => f.id === "grandparent")) return "Stop — this is a family emergency scam";
    if (findings.some((f) => f.id === "banking-change")) return "Stop — this wants to change your money";
    if (findings.some((f) => f.id === "fake-login" || f.id === "lookalike-site")) return "Stop — this is not a real website";
    return "Stop — this looks like a scam";
  }
  if (level === "caution") return "Be careful with this message";
  return "Nothing suspicious jumped out";
}

function summaryFor(level, findings) {
  if (level === "danger") {
    return "Take your time. You are safe if you close this and do nothing. Call the company using a number on your card or statement — not a number from this message.";
  }
  if (level === "caution") {
    return "Some warning signs are present. Do not type passwords or bank details until you check with the company yourself.";
  }
  return "Guardy did not find the usual scam tricks. Stay cautious with unexpected requests for money.";
}

function adviceFor(level, findings) {
  const tips = [
    "Nothing bad happens if you ignore or delete a scam message.",
    "Open banks and government sites by typing the address yourself, never from a surprise email.",
  ];
  if (findings.some((f) => f.id === "banking-change")) {
    tips.unshift("Do not change direct deposit, routing, or account numbers from this message.");
  }
  if (findings.some((f) => f.id === "grandparent" || f.id === "secrecy")) {
    tips.unshift("Call your family at a phone number you already have. Do not use numbers from the message.");
  }
  if (level === "safe") {
    return ["If something still feels off, pause and ask someone you trust."];
  }
  return tips.slice(0, 3);
}

export function analyze(raw = {}) {
  const input = {
    subject: raw.subject || "",
    senderName: raw.senderName || "",
    senderEmail: raw.senderEmail || "",
    replyTo: raw.replyTo || "",
    body: raw.body || "",
    links: Array.isArray(raw.links) ? raw.links : [],
    pageUrl: raw.pageUrl || "",
    pageTitle: raw.pageTitle || "",
    hasPasswordField: Boolean(raw.hasPasswordField),
    homeBank: raw.homeBank || "",
    source: raw.source || "page",
  };

  const findings = [];
  const blob = textBlob(input);
  analyzePatterns(blob, findings);
  analyzeSender(input, findings);
  analyzeLinks(input, findings);
  analyzePage(input, findings);
  analyzeCustomBank(input, findings);

  const grandparentBits = findings.filter((f) => f.id === "grandparent" || f.id === "secrecy" || f.id === "banking-change");
  if (grandparentBits.length >= 2) {
    const gp = findings.find((f) => f.id === "grandparent");
    if (gp) gp.weight += 10;
  }

  const score = scoreOf(findings);
  const level = findings.length ? levelOf(score, findings) : "safe";

  return {
    score,
    level,
    headline: headlineFor(level, findings),
    summary: summaryFor(level, findings),
    findings: findings.sort((a, b) => b.weight - a.weight),
    advice: adviceFor(level, findings),
    scannedAt: Date.now(),
    source: input.source,
    preview: {
      subject: input.subject.slice(0, 140),
      sender: input.senderEmail || input.senderName || hostnameOf(input.pageUrl),
    },
  };
}

export function analyzeUrl(url) {
  return analyze({ pageUrl: url, body: "", source: "navigation" });
}

export { DANGER, CAUTION, BRANDS };
