const RECENT_LIMIT = 3;   // how many rows "Recent Warranty Registrations" shows

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function pad(n) { return String(n).padStart(2, "0"); }
function fmt(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

const FIRST = ["Rahim", "Karim", "Sumon", "Nusrat", "Farhana", "Tanvir", "Mehedi", "Sadia", "Imran", "Jannat",
               "Rakib", "Sharmin", "Arif", "Mitu", "Shakil", "Lamia", "Nayeem", "Tania", "Faisal", "Ritu"];
const LAST  = ["Ahmed", "Islam", "Khan", "Chowdhury", "Sarker", "Uddin"];
const AREAS = ["Mirpur, Dhaka", "Uttara, Dhaka", "Dhanmondi, Dhaka", "Agrabad, Chattogram", "Khulshi, Chattogram",
               "Zindabazar, Sylhet", "Boalia, Rajshahi", "Sonadanga, Khulna", "Cantonment, Cumilla", "Kotwali, Bogura"];

const CUSTOMERS = [
  { id: "C-001", name: "Humaira Hossain", phone: "01711-223344", email: "humaira@example.com", address: "Mirpur, Dhaka" },
  { id: "C-002", name: "Hamim Hossain",   phone: "01819-556677", email: "hamim@example.com",   address: "Uttara, Dhaka" },
  { id: "C-003", name: "Rifat Hosen",     phone: "01911-889900", email: "rifat@example.com",   address: "Agrabad, Chattogram" }
];

for (let i = 0; i < 117; i++) {
  const first = FIRST[i % 20];
  const last = LAST[Math.floor(i / 20)];
  CUSTOMERS.push({
    id: "C-" + String(i + 4).padStart(3, "0"),
    name: first + " " + last,
    phone: "01" + (7 + (i % 3)) + pad(10 + (i % 90)) + "-" + String(100000 + (i * 7919) % 900000),
    email: first.toLowerCase() + "." + last.toLowerCase() + "@example.com",
    address: AREAS[i % 10]
  });
}

const PRODUCTS = {
  Laptop:     { code: "LAP", months: 24 },
  Mobile:     { code: "MOB", months: 12 },
  Television: { code: "TV",  months: 24 }
};

function makeWarranty(serial, product, customerId, invoice, purchase, expiry) {
  const months = PRODUCTS[product].months;
  if (!purchase) purchase = fmt(addMonths(expiry, -months));
  if (!expiry) expiry = addMonths(new Date(purchase), months);
  return { serial: serial, product: product, customerId: customerId, invoice: invoice,
           purchase: purchase, months: months, expiry: fmt(expiry) };
}

const BASE_WARRANTIES = [
  makeWarranty("LAP001", "Laptop",     "C-001", "INV-2026-0410", "2026-10-10", null),
  makeWarranty("MOB002", "Mobile",     "C-002", "INV-2025-0318", null, addDays(TODAY, 16)),
  makeWarranty("TV003",  "Television", "C-003", "INV-2026-0422", "2026-10-15", null),
  makeWarranty("MOB005", "Mobile",     "C-003", "INV-2025-0207", null, addDays(TODAY, -95)),
  makeWarranty("LAP004", "Laptop",     "C-002", "INV-2024-0911", null, addDays(TODAY, -55))
];

const STATUS_LIST = [];
for (let i = 0; i < 83; i++) STATUS_LIST.push("active");
for (let i = 0; i < 14; i++) STATUS_LIST.push("expiring");
for (let i = 0; i < 18; i++) STATUS_LIST.push("expired");

const NAMES = Object.keys(PRODUCTS);
for (let j = 0; j < 115; j++) {
  const status = STATUS_LIST[(j * 37) % 115];
  const product = NAMES[j % 3];
  let expiry;
  if (status === "active")        expiry = addDays(TODAY, 31 + (j * 13) % 600);
  else if (status === "expiring") expiry = addDays(TODAY, 1 + (j * 7) % 30);
  else                            expiry = addDays(TODAY, -(1 + (j * 11) % 400));
  BASE_WARRANTIES.push(makeWarranty(
    PRODUCTS[product].code + (101 + j), product, CUSTOMERS[j + 3].id,
    "INV-2026-" + String(1000 + j), null, expiry));
}

function getSaved() {
  try { return JSON.parse(localStorage.getItem("officer_saved") || "[]"); }
  catch (e) { return []; }
}

function saveWarranty(w) {
  try {
    const list = getSaved();
    list.push(w);
    localStorage.setItem("officer_saved", JSON.stringify(list));
    return true;
  } catch (e) { return false; }
}

function getAllWarranties() { return BASE_WARRANTIES.concat(getSaved()); }

function findCustomer(id) { return CUSTOMERS.find(function (c) { return c.id === id; }); }

function getDays(w) { return Math.round((new Date(w.expiry) - TODAY) / 86400000); }

function getStatus(w) {
  const d = getDays(w);
  if (d < 0) return "expired";
  if (d <= 30) return "expiring";
  return "active";
}

function badge(w) {
  const label = { active: "Active", expiring: "Expiring Soon", expired: "Expired" }[getStatus(w)];
  return '<span class="badge badge-' + getStatus(w) + '">' + label + "</span>";
}

function daysText(w) {
  const d = getDays(w);
  if (d < 0) return Math.abs(d) + " days ago";
  return d + " days left";
}

function getRecent() {
  const saved = getSaved().slice().reverse();
  const defaults = BASE_WARRANTIES.slice(0, 3);
  return saved.concat(defaults).slice(0, RECENT_LIMIT);
}