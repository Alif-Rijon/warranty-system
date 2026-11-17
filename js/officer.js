function byId(id) { return document.getElementById(id); }

function customerName(w) {
  const c = findCustomer(w.customerId);
  return c ? c.name : "-";
}

function setupDashboard() {
  const cards = document.querySelectorAll("[data-list]");
  if (cards.length === 0) return;

  const all = getAllWarranties();
  const count = { active: 0, expiring: 0, expired: 0 };
  all.forEach(function (w) { count[getStatus(w)]++; });

  byId("count_all").textContent = CUSTOMERS.length;
  byId("count_active").textContent = count.active;
  byId("count_expiring").textContent = count.expiring;
  byId("count_expired").textContent = count.expired;

  let html = "";
  getRecent().forEach(function (w) {
    html += "<tr><td>" + customerName(w) + "</td><td>" + w.product + "</td><td>" + w.serial +
            "</td><td>" + w.purchase + "</td><td>" + badge(w) + "</td></tr>";
  });
  byId("recent_body").innerHTML = html;

  if (location.search.indexOf("saved=1") !== -1) byId("saved_note").hidden = false;

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      showList(card.getAttribute("data-list"), all);
      cards.forEach(function (c) { c.classList.remove("officer-stat-selected"); });
      card.classList.add("officer-stat-selected");
    });
  });

  byId("list_close").addEventListener("click", function () {
    byId("list_box").hidden = true;
    cards.forEach(function (c) { c.classList.remove("officer-stat-selected"); });
  });
}

function showList(type, all) {
  const titles = {
    all: "All Customers",
    active: "Active Warranty",
    expiring: "Expiring Soon (next 30 days)",
    expired: "Expired Warranty"
  };
  let head = "";
  let body = "";
  let total = 0;

  if (type === "all") {
    head = "<th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Warranties</th>";
    CUSTOMERS.forEach(function (c) {
      const n = all.filter(function (w) { return w.customerId === c.id; }).length;
      body += "<tr><td>" + c.id + "</td><td>" + c.name + "</td><td>" + c.phone + "</td><td>" + c.email +
              "</td><td>" + c.address + "</td><td>" + n + "</td></tr>";
      total++;
    });
  } else {
    head = "<th>ID</th><th>Customer</th><th>Phone</th><th>Product</th><th>Serial Number</th><th>Expiry Date</th><th>Days</th><th>Status</th>";
    all.filter(function (w) { return getStatus(w) === type; })
       .sort(function (a, b) { return getDays(a) - getDays(b); })
       .forEach(function (w) {
         const c = findCustomer(w.customerId);
         body += "<tr><td>" + c.id + "</td><td>" + c.name + "</td><td>" + c.phone + "</td><td>" + w.product +
                 "</td><td>" + w.serial + "</td><td>" + w.expiry + "</td><td>" + daysText(w) +
                 "</td><td>" + badge(w) + "</td></tr>";
         total++;
       });
  }

  byId("list_title").textContent = titles[type] + " (" + total + ")";
  byId("list_head").innerHTML = "<tr>" + head + "</tr>";
  byId("list_body").innerHTML = body;
  byId("list_box").hidden = false;
  byId("list_box").scrollIntoView({ behavior: "smooth" });
}

function setupCustomerSearch() {
  const input = byId("customer_search");
  if (!input) return;

  function search() {
    const q = input.value.trim().toLowerCase();
    const out = byId("customer_result");
    if (q === "") { out.innerHTML = '<div class="box"><p>Type a name, phone, email or ID first.</p></div>'; return; }

    const found = CUSTOMERS.filter(function (c) {
      return (c.id + " " + c.name + " " + c.phone + " " + c.email).toLowerCase().indexOf(q) !== -1;
    });
    if (found.length === 0) { out.innerHTML = '<div class="box"><p>No customer found.</p></div>'; return; }

    const all = getAllWarranties();
    let html = "";
    found.slice(0, 5).forEach(function (c) {
      const list = all.filter(function (w) { return w.customerId === c.id; });
      html += '<div class="box"><h2>Customer Details: ' + c.name + "</h2>" +
        '<dl class="officer-detail">' +
        "<dt>Customer ID</dt><dd>" + c.id + "</dd>" +
        "<dt>Name</dt><dd>" + c.name + "</dd>" +
        "<dt>Phone</dt><dd>" + c.phone + "</dd>" +
        "<dt>Email</dt><dd>" + c.email + "</dd>" +
        "<dt>Address</dt><dd>" + c.address + "</dd>" +
        "<dt>Warranties</dt><dd>" + list.length + "</dd></dl>";
      if (list.length > 0) {
        html += '<div class="table-wrap officer-gap"><table><thead><tr><th>Serial Number</th><th>Product</th>' +
                "<th>Purchase Date</th><th>Expiry Date</th><th>Status</th></tr></thead><tbody>";
        list.forEach(function (w) {
          html += "<tr><td>" + w.serial + "</td><td>" + w.product + "</td><td>" + w.purchase +
                  "</td><td>" + w.expiry + "</td><td>" + badge(w) + "</td></tr>";
        });
        html += "</tbody></table></div>";
      }
      html += "</div>";
    });
    if (found.length > 5) html += '<p class="form-note">Showing 5 of ' + found.length + " customers. Type more of the name.</p>";
    out.innerHTML = html;
  }

  byId("customer_btn").addEventListener("click", search);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") search(); });
}

function setupRegister() {
  const form = byId("warranty_form");
  if (!form) return;

  let options = '<option value="">-- Select customer --</option>';
  CUSTOMERS.forEach(function (c) { options += "<option value=\"" + c.id + "\">" + c.id + " | " + c.name + "</option>"; });
  byId("customer").innerHTML = options;

  const product = byId("product");
  const purchase = byId("purchase_date");
  const months = byId("months");
  const expiry = byId("expiry_date");
  const preview = byId("preview");

  function update() {
    if (purchase.value && months.value) {
      const d = addMonths(new Date(purchase.value), Number(months.value));
      expiry.value = fmt(d);
      const w = { expiry: expiry.value };
      preview.innerHTML = "Expires on <b>" + expiry.value + "</b> &nbsp; " + badge(w);
    } else {
      expiry.value = "";
      preview.textContent = "Expiry date and status will appear here.";
    }
  }

  product.addEventListener("change", function () {
    if (product.value) months.value = PRODUCTS[product.value].months;
    update();
  });
  purchase.addEventListener("change", update);
  months.addEventListener("input", update);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const serial = byId("serial_no").value.trim().toUpperCase();
    if (getAllWarranties().some(function (w) { return w.serial === serial; })) {
      alert("This serial number is already registered.");
      return;
    }
    saveWarranty({
      serial: serial,
      product: product.value,
      customerId: byId("customer").value,
      invoice: byId("invoice_no").value.trim(),
      purchase: purchase.value,
      months: Number(months.value),
      expiry: expiry.value
    });
    location.href = "officer_dashboard.html?saved=1";
  });
}

function setupCertificate() {
  const input = byId("cert_input");
  if (!input) return;

  function search() {
    const serial = input.value.trim().toUpperCase();
    const w = getAllWarranties().find(function (x) { return x.serial === serial; });
    byId("certificate").hidden = true;

    if (serial === "") { byId("cert_msg").textContent = "Type a serial number first."; return; }
    if (!w) { byId("cert_msg").textContent = "Warranty Not Found!"; return; }

    const c = findCustomer(w.customerId);
    byId("cert_msg").textContent = "";
    byId("c_serial").textContent = w.serial;
    byId("c_product").textContent = w.product;
    byId("c_invoice").textContent = w.invoice;
    byId("c_customer").textContent = c.name + " (" + c.id + ")";
    byId("c_phone").textContent = c.phone;
    byId("c_purchase").textContent = w.purchase;
    byId("c_period").textContent = w.months + " months";
    byId("c_expiry").textContent = w.expiry;
    byId("c_status").innerHTML = badge(w) + " " + daysText(w);
    byId("certificate").hidden = false;
  }

  byId("cert_btn").addEventListener("click", search);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") search(); });
  byId("print_btn").addEventListener("click", function () { window.print(); });
}

function setupSalesReport() {
  const productBody = byId("product_body");
  if (!productBody) return;

  const all = getAllWarranties();
  const names = Object.keys(PRODUCTS);

  let html = "";
  const sum = { total: 0, active: 0, expiring: 0, expired: 0 };
  names.forEach(function (name) {
    const list = all.filter(function (w) { return w.product === name; });
    const n = { active: 0, expiring: 0, expired: 0 };
    list.forEach(function (w) { n[getStatus(w)]++; });
    html += "<tr><td>" + name + "</td><td>" + list.length + "</td><td>" + n.active + "</td><td>" +
            n.expiring + "</td><td>" + n.expired + "</td></tr>";
    sum.total += list.length; sum.active += n.active; sum.expiring += n.expiring; sum.expired += n.expired;
  });
  html += "<tr><td><b>Total</b></td><td><b>" + sum.total + "</b></td><td><b>" + sum.active + "</b></td><td><b>" +
          sum.expiring + "</b></td><td><b>" + sum.expired + "</b></td></tr>";
  productBody.innerHTML = html;

  html = "";
  for (let i = 0; i < 6; i++) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    const key = d.getFullYear() + "-" + pad(d.getMonth() + 1);
    const inMonth = all.filter(function (w) { return w.purchase.slice(0, 7) === key; });
    html += "<tr><td>" + key + "</td>";
    names.forEach(function (name) {
      html += "<td>" + inMonth.filter(function (w) { return w.product === name; }).length + "</td>";
    });
    html += "<td><b>" + inMonth.length + "</b></td></tr>";
  }
  byId("month_body").innerHTML = html;
}

setupDashboard();
setupCustomerSearch();
setupRegister();
setupCertificate();
setupSalesReport();