/** Official domains for brands scammers impersonate. Used to spot lookalikes. */
export const BRANDS = [
  {
    name: "IRS",
    aliases: ["internal revenue", "irs.gov", "tax refund"],
    domains: ["irs.gov"],
  },
  {
    name: "Social Security",
    aliases: ["social security", "ssa", "ssi benefits"],
    domains: ["ssa.gov", "socialsecurity.gov"],
  },
  {
    name: "Medicare",
    aliases: ["medicare", "cms"],
    domains: ["medicare.gov", "cms.gov"],
  },
  {
    name: "AARP",
    aliases: ["aarp"],
    domains: ["aarp.org"],
  },
  {
    name: "Chase",
    aliases: ["chase bank", "jpmorgan chase", "jp morgan"],
    domains: ["chase.com", "jpmorganchase.com", "jpmorgan.com"],
  },
  {
    name: "Bank of America",
    aliases: ["bank of america", "bofa"],
    domains: ["bankofamerica.com", "bofa.com", "ml.com"],
  },
  {
    name: "Wells Fargo",
    aliases: ["wells fargo"],
    domains: ["wellsfargo.com", "wf.com"],
  },
  {
    name: "Citibank",
    aliases: ["citibank", "citi bank", "citi"],
    domains: ["citi.com", "citibank.com", "citigroup.com"],
  },
  {
    name: "U.S. Bank",
    aliases: ["us bank", "u.s. bank"],
    domains: ["usbank.com"],
  },
  {
    name: "Capital One",
    aliases: ["capital one"],
    domains: ["capitalone.com"],
  },
  {
    name: "PNC",
    aliases: ["pnc bank"],
    domains: ["pnc.com"],
  },
  {
    name: "Navy Federal",
    aliases: ["navy federal"],
    domains: ["navyfederal.org"],
  },
  {
    name: "PayPal",
    aliases: ["paypal"],
    domains: ["paypal.com", "paypal.me"],
  },
  {
    name: "Venmo",
    aliases: ["venmo"],
    domains: ["venmo.com"],
  },
  {
    name: "Apple",
    aliases: ["apple id", "apple support", "icloud", "app store"],
    domains: ["apple.com", "icloud.com", "appleid.apple.com"],
  },
  {
    name: "Microsoft",
    aliases: ["microsoft", "outlook support", "windows support", "xbox"],
    domains: ["microsoft.com", "live.com", "office.com", "xbox.com", "microsoftonline.com"],
  },
  {
    name: "Amazon",
    aliases: ["amazon", "amazon prime", "aws"],
    domains: ["amazon.com", "amazon.co.uk", "aws.amazon.com"],
  },
  {
    name: "Google",
    aliases: ["google", "gmail", "youtube"],
    domains: ["google.com", "gmail.com", "youtube.com", "googlemail.com"],
  },
  {
    name: "USPS",
    aliases: ["usps", "postal service", "package delivery"],
    domains: ["usps.com", "usps.gov"],
  },
  {
    name: "UPS",
    aliases: ["ups delivery"],
    domains: ["ups.com"],
  },
  {
    name: "FedEx",
    aliases: ["fedex"],
    domains: ["fedex.com"],
  },
  {
    name: "Netflix",
    aliases: ["netflix"],
    domains: ["netflix.com"],
  },
  {
    name: "Veterans Affairs",
    aliases: ["veterans affairs", "va.gov", "va benefits"],
    domains: ["va.gov"],
  },
  {
    name: "FTC",
    aliases: ["federal trade commission"],
    domains: ["ftc.gov"],
  },
];

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mail.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "yandex.com",
  "zoho.com",
]);

export const URL_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "tiny.cc",
]);

export const SUSPICIOUS_TLDS = new Set([
  "zip",
  "mov",
  "xyz",
  "top",
  "gq",
  "tk",
  "ml",
  "cf",
  "ga",
  "click",
  "country",
  "stream",
  "download",
  "review",
  "surf",
  "rest",
  "quest",
  "cfd",
  "sbs",
  "cyou",
]);

const HOMOGLYPHS = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  "$": "s",
};

export function normalizeLookalike(text) {
  return [...text.toLowerCase()]
    .map((ch) => HOMOGLYPHS[ch] || ch)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return row[b.length];
}

export function hostnameOf(urlLike) {
  try {
    const withProto = /^[a-z]+:\/\//i.test(urlLike) ? urlLike : `https://${urlLike}`;
    return new URL(withProto).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function registrableDomain(host) {
  if (!host) return "";
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const twoLevel = new Set(["co.uk", "com.au", "co.nz", "com.br", "co.jp"]);
  const lastTwo = parts.slice(-2).join(".");
  const lastThree = parts.slice(-3).join(".");
  if (twoLevel.has(lastTwo)) return lastThree;
  return lastTwo;
}

function hasPhrase(hay, phrase) {
  const compact = phrase.toLowerCase().trim();
  if (!compact) return false;
  if (compact.length <= 4) {
    const escaped = compact.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(hay);
  }
  return hay.toLowerCase().includes(compact);
}

export function findBrandForText(text) {
  const hay = text || "";
  return BRANDS.find(
    (brand) => brand.aliases.some((alias) => hasPhrase(hay, alias)) || hasPhrase(hay, brand.name)
  );
}

export function brandOwnsDomain(brand, host) {
  if (!brand || !host) return false;
  const reg = registrableDomain(host);
  return brand.domains.some((d) => reg === d || host === d || host.endsWith(`.${d}`));
}

const GENERIC_LABELS = new Set([
  "www", "com", "net", "org", "edu", "gov", "co", "uk", "us", "io", "app", "mail", "email",
]);

export function findLookalikeBrand(host) {
  if (!host) return null;
  if (BRANDS.some((brand) => brandOwnsDomain(brand, host))) return null;

  const compact = normalizeLookalike(registrableDomain(host).split(".")[0]);
  const tokens = host
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => normalizeLookalike(part))
    .filter((part) => part && !GENERIC_LABELS.has(part));

  for (const brand of BRANDS) {
    for (const domain of brand.domains) {
      const brandLabel = normalizeLookalike(domain.split(".")[0]);
      if (brandLabel.length < 3) continue;

      const spoofed = compact === brandLabel;
      const tokenHit = tokens.some((token) => token === brandLabel);
      const attached =
        compact !== brandLabel &&
        compact.length - brandLabel.length >= 4 &&
        (compact.startsWith(brandLabel) || compact.endsWith(brandLabel));
      const dist = levenshtein(compact, brandLabel);
      const similar = dist === 1 && brandLabel.length >= 6 && compact.length >= 5;

      if (spoofed || tokenHit || attached || similar) {
        return { brand, official: domain, host };
      }
    }
  }
  return null;
}
