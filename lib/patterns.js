export const PATTERNS = {
  urgency: {
    id: "urgency",
    weight: 18,
    title: "This message is trying to rush you",
    detail:
      "Scammers create panic so you act before thinking. Real banks and government offices give you time.",
    tests: [
      /\b(act now|do it now|immediately|right away|urgently)\b/i,
      /\b(within (24|48) hours|expires? (today|tonight|soon)|final notice)\b/i,
      /\b(account (will be )?(suspended|closed|locked|terminated|frozen))\b/i,
      /\b(unusual (sign[- ]?in|activity)|unauthorized (charge|transaction))\b/i,
      /\b(failure to (act|respond|verify)|limited time|last chance)\b/i,
      /\b(respond (immediately|asap)|today is the last day)\b/i,
    ],
  },
  verifyAccount: {
    id: "verify-account",
    weight: 22,
    title: "It asks you to confirm a password or account",
    detail:
      "Your bank already has your information. They will not email you asking for your password, PIN, or full account number.",
    tests: [
      /\b(verify|confirm|update|validate)\s+(your\s+)?(account|identity|information|details|password|login)\b/i,
      /\b(sign in|log in|re-?verify|authenticate)\b.{0,40}\b(link|below|here|now)\b/i,
      /\b(one[- ]time (code|password|passcode)|otp)\b/i,
      /\b(enter (your )?(password|pin|ssn|social security|routing number))\b/i,
    ],
  },
  bankingChange: {
    id: "banking-change",
    weight: 42,
    title: "It wants you to change banking or payment information",
    detail:
      "This is a very common scam. Never change direct deposit, routing numbers, or payment details because of an email or text. Call the company using a number you already have.",
    tests: [
      /\b(update|change|switch|replace|new)\s+(your\s+)?(bank|banking|routing|account|payment|direct deposit|payroll)\b/i,
      /\b(direct deposit|routing number|account number|swift code|iban)\b/i,
      /\b(send( us)? (an? )?(updated|new) (bank|account|payment) (info|details|information))\b/i,
      /\b(vendor portal|payee information|ach (change|update|details))\b/i,
      /\b(overpaid|over ?payment|refund the difference)\b/i,
      /\b(gift ?cards?|apple gift|google play card|steam card)\b/i,
      /\b(bitcoin|btc\b|ethereum|usdt|crypto(currency)? wallet|wire (transfer|money))\b/i,
      /\b(western union|moneygram|zelle|cashapp|cash app|venmo me)\b/i,
      /\b(purchase .{0,20}gift cards? and (send|scratch|read))\b/i,
    ],
  },
  personalData: {
    id: "personal-data",
    weight: 28,
    title: "It asks for private information",
    detail:
      "Social Security numbers, Medicare numbers, PINs, and passwords should never be typed after clicking a link in an unexpected message.",
    tests: [
      /\b(social security( number)?|ssn\b|medicare (number|id)|date of birth)\b/i,
      /\b(mother'?s maiden|security questions?|cvv|cid|pin number)\b/i,
      /\b(full (ssn|social)|last four of (your )?(ssn|social))\b/i,
      /\b(credit card (number|details|on file))\b/i,
    ],
  },
  secrecy: {
    id: "secrecy",
    weight: 30,
    title: "It tells you to keep this a secret",
    detail:
      "Legitimate companies never ask you to hide a money request from family. Secrecy is a hallmark of a scam.",
    tests: [
      /\b(don'?t tell|do not tell|keep this (a )?secret|between us)\b/i,
      /\b(don'?t (call|tell) (your )?(mom|dad|son|daughter|family|anyone))\b/i,
      /\b(this is confidential|speak to no one)\b/i,
    ],
  },
  grandparent: {
    id: "grandparent",
    weight: 38,
    title: "It sounds like the 'grandparent emergency' scam",
    detail:
      "Someone pretends a grandchild is in jail, in an accident, or stranded, and begs for money. Hang up and call your family at a number you already know.",
    tests: [
      /\b(grandma|grandpa|grandmother|grandfather|nana|papa)\b/i,
      /\b(in (jail|prison|trouble)|been arrested|car (accident|wreck)|stranded)\b/i,
      /\b(need (you to )?(send|wire|post) (money|bail|cash))\b/i,
      /\b(please help me|i can'?t talk long|this is my one phone call)\b/i,
    ],
  },
  techSupport: {
    id: "tech-support",
    weight: 32,
    title: "It pretends to be tech support",
    detail:
      "Apple, Microsoft, and your internet company will not cold-call or email to take remote control of your computer. Do not call numbers from the message.",
    tests: [
      /\b(microsoft (support|security)|apple (care|support|id locked))\b/i,
      /\b(your (pc|computer|mac|device) (is|has been) (infected|hacked|compromised))\b/i,
      /\b(call (this|the) number.{0,20}(immediately|now))\b/i,
      /\b(allow remote (access|control)|install (anydesk|teamviewer))\b/i,
    ],
  },
  prize: {
    id: "prize",
    weight: 24,
    title: "It promises a prize, refund, or inheritance",
    detail:
      "You cannot win a lottery you never entered. Fees to 'release' money are always a scam.",
    tests: [
      /\b(you (have )?won|congratulations.{0,30}(winner|selected|prize))\b/i,
      /\b(unclaimed (refund|inheritance|settlement)|beneficiary)\b/i,
      /\b(claim your (reward|prize|refund)|free iphone)\b/i,
      /\b(pay (a )?processing fee|tax to release)\b/i,
    ],
  },
  threat: {
    id: "threat",
    weight: 26,
    title: "It threatens arrest, lawsuits, or lost benefits",
    detail:
      "The IRS, Social Security, and Medicare do not threaten arrest by email. Hang up on anyone who does.",
    tests: [
      /\b(warrant (has been )?issued|you will be arrested|law enforcement)\b/i,
      /\b(lawsuit|legal action|collections agency)\b/i,
      /\b(benefits? (will be )?(stopped|cut off|suspended))\b/i,
      /\b(fine of \$?\d+|owed to the (irs|government))\b/i,
    ],
  },
};

export const LINK_TEXT_HINTS = /\b(click here|sign in|verify now|update (now|info|account)|confirm (here|now)|login)\b/i;
