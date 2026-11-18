/* Member 4: simple frontend DEMO for midterm. No PHP/MySQL or real login here. */
'use strict';

const DEMO_WARRANTIES = [
  { id: 'W-1001', product: 'Samsung 55-inch QLED TV', brand: 'Samsung', model: 'QN55', serial: 'SN-2026-004821', purchased: '2026-10-19', expires: '2028-10-19' },
  { id: 'W-1002', product: 'Walton Refrigerator', brand: 'Walton', model: 'WFC-3D8', serial: 'SN-2025-118302', purchased: '2025-12-05', expires: '2026-12-05' },
  { id: 'W-1003', product: 'Sony Headphones WH-1000', brand: 'Sony', model: 'WH-1000', serial: 'SN-2024-770115', purchased: '2024-02-12', expires: '2026-02-12' }
];

const DEMO_CLAIMS = [
  { id: 'CL-0231', warrantyId: 'W-1001', issue: 'Screen flickers and shows vertical lines after 10 minutes of use.', status: 'In Service', date: '2026-11-14', history: [
    { date: '2026-11-14', detail: 'Claim submitted (Pending)' },
    { date: '2026-11-15', detail: 'Assigned to service technician' },
    { date: '2026-11-16', detail: 'Service technician started inspection (In Service)' }
  ] }
];

const CLAIMS_KEY = 'member4_warranty_demo_claims';
const NAME_KEY = 'member4_warranty_demo_name';

function byId(id) { return document.getElementById(id); }
function dateValue(iso) { return new Date(iso + 'T12:00:00'); }
function dateLabel(iso) { return dateValue(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
function warrantyStatus(expires) {
  const end = dateValue(expires);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const days = Math.round((end - today) / 86400000);
  if (days < 0) return 'Expired';
  if (days <= 30) return 'Expiring Soon';
  return 'Active';
}
function statusBadge(status) {
  const el = document.createElement('span');
  const cls = status === 'Active' ? 'badge-active' : status === 'Expiring Soon' ? 'badge-expiring' : 'badge-expired';
  el.className = 'badge ' + cls;
  el.textContent = status;
  return el;
}
function claimBadge(status) {
  const el = document.createElement('span');
  el.className = 'badge ' + (status === 'Pending' ? 'badge-expiring' : 'badge-active');
  el.style.backgroundColor = status === 'Rejected' ? '#c0392b' : status === 'In Service' ? '#2a5298' : '';
  el.textContent = status;
  return el;
}
function cell(row, value) {
  const td = document.createElement('td');
  if (value instanceof Node) td.appendChild(value);
  else td.textContent = String(value);
  row.appendChild(td);
  return td;
}
function getClaims() {
  try {
    const stored = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '[]');
    return [...stored, ...DEMO_CLAIMS];
  } catch { return [...DEMO_CLAIMS]; }
}
function message(element, content, success) {
  element.textContent = content;
  element.className = 'customer-alert ' + (success ? 'customer-alert-success' : 'customer-alert-error');
  element.hidden = false;
}
function warrantyById(id) { return DEMO_WARRANTIES.find(w => w.id === id); }

function setupDashboard() {
  if (!byId('dashboardWarranties')) return;
  const savedName = localStorage.getItem(NAME_KEY);
  if (savedName) byId('customerGreeting').textContent = 'Welcome, ' + savedName;
  byId('totalWarranties').textContent = DEMO_WARRANTIES.length;
  byId('activeWarranties').textContent = DEMO_WARRANTIES.filter(w => warrantyStatus(w.expires) === 'Active').length;
  byId('expiringWarranties').textContent = DEMO_WARRANTIES.filter(w => warrantyStatus(w.expires) === 'Expiring Soon').length;
  byId('totalClaims').textContent = getClaims().length;
  const tbody = byId('dashboardWarranties');
  DEMO_WARRANTIES.forEach(w => {
    const tr = document.createElement('tr');
    cell(tr, w.product); cell(tr, w.serial); cell(tr, dateLabel(w.expires)); cell(tr, statusBadge(warrantyStatus(w.expires)));
    tbody.appendChild(tr);
  });
  const latest = getClaims()[0];
  const product = warrantyById(latest.warrantyId);
  byId('latestClaim').textContent = `${latest.id} · ${product ? product.product : 'Product'} · ${latest.status}`;
}

function setupWarrantyList() {
  const tbody = byId('warrantyRows');
  if (!tbody) return;
  const field = byId('warrantySearch');
  function render() {
    tbody.replaceChildren();
    const q = field.value.trim().toLowerCase();
    const matches = DEMO_WARRANTIES.filter(w => `${w.product} ${w.serial} ${w.id}`.toLowerCase().includes(q));
    matches.forEach(w => {
      const tr = document.createElement('tr');
      cell(tr, w.product); cell(tr, w.serial); cell(tr, dateLabel(w.purchased)); cell(tr, dateLabel(w.expires));
      cell(tr, statusBadge(warrantyStatus(w.expires)));
      const a = document.createElement('a');
      a.className = 'btn btn-small'; a.href = 'customer_submit_claim.html?warranty=' + encodeURIComponent(w.id);
      a.textContent = 'Submit claim';
      if (warrantyStatus(w.expires) === 'Expired') { a.textContent = 'Not eligible'; a.removeAttribute('href'); a.className = 'customer-meta'; }
      cell(tr, a);
      tbody.appendChild(tr);
    });
    byId('warrantyEmpty').hidden = matches.length > 0;
  }
  field.addEventListener('input', render);
  render();
}

function setupClaimForm() {
  const form = byId('claimForm');
  if (!form) return;
  const select = byId('claimWarranty');
  DEMO_WARRANTIES.filter(w => warrantyStatus(w.expires) !== 'Expired').forEach(w => {
    const option = document.createElement('option');
    option.value = w.id; option.textContent = `${w.product} (${w.serial})`;
    select.appendChild(option);
  });
  const selected = new URLSearchParams(location.search).get('warranty');
  if (selected && [...select.options].some(o => o.value === selected)) select.value = selected;
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    const id = select.value;
    const issue = byId('claimProblem').value.trim();
    const w = warrantyById(id);
    if (!w || warrantyStatus(w.expires) === 'Expired') {
      message(byId('claimMessage'), 'Select an eligible, non-expired warranty.', false);
      return;
    }
    if (issue.length < 10) {
      message(byId('claimMessage'), 'Please describe the problem using at least 10 characters.', false);
      return;
    }
    let saved;
    try { saved = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '[]'); }
    catch { saved = []; }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const claim = { id: 'CL-' + String(Date.now()).slice(-6), warrantyId: id, issue, status: 'Pending', date: today,
      history: [{ date: today, detail: 'Claim submitted (Pending)' }] };
    saved.unshift(claim);
    localStorage.setItem(CLAIMS_KEY, JSON.stringify(saved));
    window.location.href = 'customer_claims.html?submitted=1';
  });
}

function setupClaimsList() {
  const tbody = byId('claimsRows');
  if (!tbody) return;
  const claims = getClaims();
  claims.forEach(claim => {
    const w = warrantyById(claim.warrantyId);
    const tr = document.createElement('tr');
    cell(tr, claim.id); cell(tr, w ? w.product : 'Unknown product'); cell(tr, dateLabel(claim.date)); cell(tr, claimBadge(claim.status));
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn btn-small'; btn.textContent = 'View details';
    btn.addEventListener('click', () => showClaim(claim));
    cell(tr, btn); tbody.appendChild(tr);
  });
  if (new URLSearchParams(location.search).has('submitted')) {
    message(byId('claimSubmitted'), 'Demo claim saved in this browser. This is not a server submission.', true);
  }
  if (claims.length) showClaim(claims[0]);
}
function showClaim(claim) {
  const detail = byId('claimDetail');
  detail.hidden = false;
  const w = warrantyById(claim.warrantyId);
  byId('claimDetailTitle').textContent = `Claim ${claim.id}`;
  byId('claimDetailProduct').textContent = w ? w.product : 'Product';
  byId('claimDetailIssue').textContent = claim.issue;
  byId('claimDetailStatus').replaceChildren(claimBadge(claim.status));
  const history = byId('claimHistory'); history.replaceChildren();
  claim.history.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry.detail;
    const small = document.createElement('small'); small.textContent = dateLabel(entry.date);
    li.appendChild(small); history.appendChild(li);
  });
}

function setupPublicCheck() {
  const form = byId('publicCheckForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const serial = byId('serialLookup').value.trim().toUpperCase();
    const result = byId('publicResult'); result.hidden = false; result.replaceChildren();
    const w = DEMO_WARRANTIES.find(warranty => warranty.serial.toUpperCase() === serial);
    if (!w) {
      const p = document.createElement('p'); p.textContent = 'No matching warranty found. Check the serial number and try again.';
      result.appendChild(p); return;
    }
    const title = document.createElement('h2'); title.textContent = w.product; result.appendChild(title);
    result.appendChild(statusBadge(warrantyStatus(w.expires)));
    const dl = document.createElement('dl');
    const fields = [['Brand / model', w.brand + ' / ' + w.model], ['Purchase date', dateLabel(w.purchased)], ['Warranty expires', dateLabel(w.expires)]];
    fields.forEach(([key, value]) => {
      const dt = document.createElement('dt'); dt.textContent = key;
      const dd = document.createElement('dd'); dd.textContent = value;
      dl.append(dt, dd);
    });
    result.appendChild(dl);
    const note = document.createElement('p'); note.className = 'customer-help';
    note.textContent = 'Public results exclude customer identity, contact information, invoices and service notes.';
    result.appendChild(note);
  });
}

function setupRegister() {
  const form = byId('registerForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fullName = byId('registerName').value.trim();
    const email = byId('registerEmail').value.trim();
    const password = byId('registerPassword').value;
    const confirm = byId('registerConfirm').value;
    if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message(byId('registerMessage'), 'Enter your name and a valid email address.', false); return;
    }
    if (password.length < 8 || password !== confirm) {
      message(byId('registerMessage'), 'Password must have at least 8 characters and match the confirmation.', false); return;
    }
    // Demo only: save a display name, NOT password, email or contact details.
    localStorage.setItem(NAME_KEY, fullName);
    message(byId('registerMessage'), 'Demo registration preview complete! No real account was created. Please sign in using the demo customer account.', true);
    byId('registerNext').hidden = false;
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupRegister(); setupDashboard(); setupWarrantyList();
  setupClaimForm(); setupClaimsList(); setupPublicCheck();
});
