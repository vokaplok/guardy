import { analyze } from "../lib/detector.js";
import { paintResult } from "../content/ui.js";

const SAMPLES = [
  {
    id: "bank",
    badge: "Banking scam",
    senderName: "Chase Bank Security",
    senderEmail: "secure-alerts@chase-support-login.xyz",
    subject: "Urgent: update your routing number today",
    body: `Dear customer,

We noticed unusual activity. Your account will be suspended within 24 hours unless you update your bank routing number and direct deposit information.

Click here to verify your account immediately:
https://chase-support-login.xyz/secure/update-account

Do not tell anyone about this request. It is confidential.

Chase Bank Security`,
    links: [
      { text: "Click here to verify your account immediately", href: "https://chase-support-login.xyz/secure/update-account" },
    ],
  },
  {
    id: "grandma",
    badge: "Family emergency",
    senderName: "Ryan",
    senderEmail: "ryan.helpnow@gmail.com",
    subject: "Grandma please don’t tell mom",
    body: `Grandma it's me. I had a car accident and I am in trouble. I can't talk long. Please don't tell mom. I need you to send money with gift cards or Zelle as soon as you can. Reply and I will tell you where to send it.`,
    links: [],
  },
  {
    id: "irs",
    badge: "Government impersonation",
    senderName: "Internal Revenue Service",
    senderEmail: "refunds@irs-gov-payments.com",
    subject: "You have an unclaimed tax refund",
    body: `The IRS has issued you a refund. Confirm your identity and enter your Social Security number and bank account number so we can wire the money.

Verify now: http://irs-gov-payments.com/refund

A warrant may be issued if you do not act now.`,
    links: [{ text: "Verify now", href: "http://irs-gov-payments.com/refund" }],
  },
  {
    id: "safe",
    badge: "Looks ordinary",
    senderName: "Westside Library",
    senderEmail: "hello@westsidelibrary.org",
    subject: "Your holds are ready",
    body: `Hi neighbor,

The two books you requested are waiting at the front desk through Thursday. No password or payment is needed. Come by whenever you like.

Westside Library`,
    links: [{ text: "westsidelibrary.org", href: "https://westsidelibrary.org/hours" }],
  },
];

const list = document.getElementById("list");
const letter = document.getElementById("letter");
const empty = document.getElementById("empty");

list.innerHTML = SAMPLES.map(
  (item) => `<button data-id="${item.id}">
    <b>${item.subject}</b>
    <span>${item.badge} · ${item.senderName}</span>
  </button>`
).join("");

list.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  openSample(btn.dataset.id);
});

function openSample(id) {
  const sample = SAMPLES.find((item) => item.id === id);
  if (!sample) return;
  list.querySelectorAll("button").forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  empty.hidden = true;
  letter.hidden = false;
  document.getElementById("from").textContent = `${sample.senderName} <${sample.senderEmail}>`;
  document.getElementById("subject").textContent = sample.subject;
  document.getElementById("body").innerHTML = sample.body.replace(/\n/g, "<br>");
  const result = analyze({ ...sample, source: "gmail", pageUrl: location.href, pageTitle: document.title });
  paintResult(result, { familyName: "a trusted helper", familyPhone: "" });
}

const preset = new URLSearchParams(location.search).get("open");
if (preset) openSample(preset);
