//Common functions

function showError(input, message) {
  input.classList.add("admin-invalid");
  input.classList.remove("admin-valid");
  input.nextElementSibling.innerHTML = message;
}

function showSuccess(input) {
  input.classList.remove("admin-invalid");
  input.classList.add("admin-valid");
}

function clearErrors() {
  let errors = document.querySelectorAll(".admin-error");
  errors.forEach(function (item) {
    item.innerHTML = "";
  });

  let fields = document.querySelectorAll("input, select");
  fields.forEach(function (field) {
    field.classList.remove("admin-invalid");
    field.classList.remove("admin-valid");
  });
}

// Show the green (success) or red (error) message box at the top of the page
function showMessage(boxId, message, type) {
  let box = document.getElementById(boxId);
  box.innerHTML = message;
  if (type === "error") {
    box.className = "admin-msg admin-msg-error";
  } else {
    box.className = "admin-msg admin-msg-success";
  }
  box.hidden = false;
}

// All data rows of a table 
function getRows(tableId) {
  return document.querySelectorAll("#" + tableId + " tbody tr:not(.admin-empty-row)");
}

// Show or hide the "No matching records found." row
function showEmptyRow(tableId, shown) {
  let tbody = document.querySelector("#" + tableId + " tbody");
  let emptyRow = tbody.querySelector(".admin-empty-row");

  if (emptyRow === null) {
    emptyRow = tbody.insertRow();
    emptyRow.className = "admin-empty-row";
    let cell = emptyRow.insertCell();
    cell.colSpan = document.querySelectorAll("#" + tableId + " thead th").length;
    cell.textContent = "No matching records found.";
  }

  if (shown === 0) {
    emptyRow.style.display = "";
  } else {
    emptyRow.style.display = "none";
  }
}

// Dashboard: fill the status bars

let bars = document.querySelectorAll(".admin-bar-fill");
let maxValue = 0;

// find the biggest number 
bars.forEach(function (bar) {
  let value = Number(bar.getAttribute("data-value"));
  if (value > maxValue) {
    maxValue = value;
  }
});

bars.forEach(function (bar) {
  let value = Number(bar.getAttribute("data-value"));
  bar.style.width = (value / maxValue * 100) + "%";
});


// User & Role Management 
 
const userForm = document.getElementById("userForm");
let editingUserRow = null;   

if (userForm !== null) {
  userForm.addEventListener("submit", function (event) {
    event.preventDefault();  
    clearErrors();
    document.getElementById("userMsg").hidden = true;

    let name = document.getElementById("userName");
    let email = document.getElementById("userEmail");
    let phone = document.getElementById("userPhone");
    let role = document.getElementById("userRole");
    let password = document.getElementById("userPassword");

    let valid = true;

    // Name validation
    if (name.value.trim() === "") {
      showError(name, "Name is required.");
      valid = false;
    } else if (!/^[A-Za-z ]+$/.test(name.value.trim())) {
      showError(name, "Only letters and spaces are allowed.");
      valid = false;
    } else if (name.value.trim().length < 3) {
      showError(name, "Name must be at least 3 characters.");
      valid = false;
    } else {
      showSuccess(name);
    }

    // Email validation (format + not used by another account)
    if (email.value.trim() === "") {
      showError(email, "Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      showError(email, "Enter a valid email address.");
      valid = false;
    } else if (emailExists(email.value.trim())) {
      showError(email, "This email is already used.");
      valid = false;
    } else {
      showSuccess(email);
    }

    // Phone validation (013 to 019)
    if (phone.value.trim() === "") {
      showError(phone, "Phone number is required.");
      valid = false;
    } else if (!/^01[3-9][0-9]{8}$/.test(phone.value.trim())) {
      showError(phone, "Must be 11 digits starting with 013-019.");
      valid = false;
    } else {
      showSuccess(phone);
    }

    // Role (select)
    if (role.value === "") {
      showError(role, "Please select a role.");
      valid = false;
    } else {
      showSuccess(role);
    }

    // Password: required for a new account, can stay empty when editing
    if (editingUserRow === null && password.value === "") {
      showError(password, "Password is required.");
      valid = false;
    } else if (password.value !== "" && password.value.length < 6) {
      showError(password, "Password must be at least 6 characters.");
      valid = false;
    } else {
      showSuccess(password);
    }

    // Success
    if (valid) {
      let message = "";

      if (editingUserRow === null) {
        addUserRow(name.value.trim(), email.value.trim(), phone.value.trim(), role.value);
        message = "Account created for " + name.value.trim() + " (" + role.value + ")";
      } else {
        editingUserRow.cells[1].textContent = name.value.trim();
        editingUserRow.cells[2].textContent = email.value.trim();
        editingUserRow.cells[3].textContent = phone.value.trim();
        editingUserRow.cells[4].textContent = role.value;
        message = "Account of " + name.value.trim() + " updated";
      }

      resetUserForm();
      filterUsers();
      showMessage("userMsg", message, "success");
    }
  });

  // Cancel button
  document.getElementById("userCancel").addEventListener("click", resetUserForm);

  // Buttons inside the table
  document.querySelector("#usersTable tbody").addEventListener("click", function (event) {
    let button = event.target;
    if (button.tagName !== "BUTTON") {
      return;   
    }

    let action = button.getAttribute("data-action");
    if (action === "edit") {
      editUser(button);
    } else if (action === "toggle") {
      toggleUser(button);
    } else if (action === "reset") {
      resetPassword(button);
    }
  });

  // Search box and filters
  let toolbar = document.querySelector('[data-table="usersTable"]');
  toolbar.querySelector(".admin-search").addEventListener("input", filterUsers);
  toolbar.querySelector('select[data-col="4"]').addEventListener("change", filterUsers);
  toolbar.querySelector('select[data-col="5"]').addEventListener("change", filterUsers);
}

// Add a new row at the end of the users table
function addUserRow(name, email, phone, role) {
  let tbody = document.querySelector("#usersTable tbody");
  let row = tbody.insertRow();   

  row.insertCell().textContent = nextUserId();
  row.insertCell().textContent = name;
  row.insertCell().textContent = email;
  row.insertCell().textContent = phone;
  row.insertCell().textContent = role;
  row.insertCell().innerHTML = '<span class="badge badge-active">Active</span>';

  let actions = row.insertCell();
  actions.className = "admin-actions";
  actions.innerHTML =
    '<button type="button" class="btn btn-small" data-action="edit">Edit</button> ' +
    '<button type="button" class="btn btn-small btn-gray" data-action="reset">Reset Password</button> ' +
    '<button type="button" class="btn btn-small admin-btn-danger" data-action="toggle">Deactivate</button>';
}

// Next ID
function nextUserId() {
  let max = 0;
  getRows("usersTable").forEach(function (row) {
    let number = Number(row.cells[0].textContent.replace("U-", ""));
    if (number > max) {
      max = number;
    }
  });
  return "U-" + String(max + 1).padStart(3, "0");
}
//email exist check
function emailExists(email) {
  let found = false;
  getRows("usersTable").forEach(function (row) {
    if (row !== editingUserRow && row.cells[2].textContent.toLowerCase() === email.toLowerCase()) {
      found = true;
    }
  });
  return found;
}

// Edit button: copy the row into the form
function editUser(button) {
  let row = button.parentElement.parentElement;   // button -> td -> tr
  editingUserRow = row;

  document.getElementById("userName").value = row.cells[1].textContent;
  document.getElementById("userEmail").value = row.cells[2].textContent;
  document.getElementById("userPhone").value = row.cells[3].textContent;
  document.getElementById("userRole").value = row.cells[4].textContent;
  document.getElementById("userPassword").value = "";

  document.getElementById("userFormTitle").innerHTML = "Edit staff account (" + row.cells[0].textContent + ")";
  document.getElementById("userSubmit").innerHTML = "Update Account";
  clearErrors();
  userForm.scrollIntoView();
}

// Deactivate / Activate button
function toggleUser(button) {
  let row = button.parentElement.parentElement;
  let name = row.cells[1].textContent;
  let badge = row.cells[5].querySelector(".badge");

  if (badge.textContent === "Active") {
    if (confirm("Deactivate " + name + "'s account?")) {
      badge.textContent = "Deactivated";
      badge.className = "badge admin-badge-inactive";
      button.textContent = "Activate";
      button.classList.remove("admin-btn-danger");
      showMessage("userMsg", name + "'s account is now Deactivated", "success");
    }
  } else {
    if (confirm("Activate " + name + "'s account?")) {
      badge.textContent = "Active";
      badge.className = "badge badge-active";
      button.textContent = "Deactivate";
      button.classList.add("admin-btn-danger");
      showMessage("userMsg", name + "'s account is now Active", "success");
    }
  }
  filterUsers();
}

// Reset Password button
function resetPassword(button) {
  let row = button.parentElement.parentElement;
  let name = row.cells[1].textContent;

  if (confirm("Reset the password of " + name + "?")) {
    showMessage("userMsg", "Password of " + name + " was reset. Temporary password: Temp@1234", "success");
  }
}

// Cancel button 
function resetUserForm() {
  userForm.reset();
  clearErrors();
  editingUserRow = null;
  document.getElementById("userFormTitle").innerHTML = "Create staff account";
  document.getElementById("userSubmit").innerHTML = "Create Account";
}

// Search box + role filter + status filter
function filterUsers() {
  let toolbar = document.querySelector('[data-table="usersTable"]');
  let search = toolbar.querySelector(".admin-search").value.trim().toLowerCase();
  let role = toolbar.querySelector('select[data-col="4"]').value;
  let status = toolbar.querySelector('select[data-col="5"]').value;
  let shown = 0;

  getRows("usersTable").forEach(function (row) {
    let text = (row.cells[1].textContent + " " + row.cells[2].textContent + " " +
                row.cells[3].textContent).toLowerCase();
    let show = true;

    if (search !== "" && !text.includes(search)) {
      show = false;
    }
    if (role !== "" && row.cells[4].textContent !== role) {
      show = false;
    }
    if (status !== "" && row.cells[5].textContent.trim() !== status) {
      show = false;
    }

    if (show) {
      row.style.display = "";
      shown++;
    } else {
      row.style.display = "none";
    }
  });

  showEmptyRow("usersTable", shown);
}


/* =======================================================
   4. Product Catalogue (admin_products.html)
   ======================================================= */
const productForm = document.getElementById("productForm");
let editingProductRow = null;   // null = add a new product, a row = edit that row

if (productForm !== null) {
  productForm.addEventListener("submit", function (event) {
    event.preventDefault();   // stops page reload on submit
    clearErrors();
    document.getElementById("productMsg").hidden = true;

    let name = document.getElementById("productName");
    let brand = document.getElementById("productBrand");
    let model = document.getElementById("productModel");
    let category = document.getElementById("productCategory");
    let price = document.getElementById("productPrice");
    let months = document.getElementById("productMonths");

    let valid = true;

    // Product name validation (< and > are blocked so no HTML can be typed)
    if (name.value.trim() === "") {
      showError(name, "Product name is required.");
      valid = false;
    } else if (/[<>]/.test(name.value)) {
      showError(name, "< and > are not allowed.");
      valid = false;
    } else if (name.value.trim().length < 2) {
      showError(name, "Name must be at least 2 characters.");
      valid = false;
    } else {
      showSuccess(name);
    }

    // Brand validation (letters, digits and spaces)
    if (brand.value.trim() === "") {
      showError(brand, "Brand is required.");
      valid = false;
    } else if (!/^[A-Za-z0-9 ]+$/.test(brand.value.trim())) {
      showError(brand, "Only letters, digits and spaces are allowed.");
      valid = false;
    } else {
      showSuccess(brand);
    }

    // Model validation (letters, digits and "-", must be unique)
    if (model.value.trim() === "") {
      showError(model, "Model is required.");
      valid = false;
    } else if (!/^[A-Za-z0-9-]+$/.test(model.value.trim())) {
      showError(model, "Only letters, digits and - are allowed.");
      valid = false;
    } else if (modelExists(model.value.trim())) {
      showError(model, "This model is already in the catalogue.");
      valid = false;
    } else {
      showSuccess(model);
    }

    // Category (select)
    if (category.value === "") {
      showError(category, "Please select a category.");
      valid = false;
    } else {
      showSuccess(category);
    }

    // Price validation (number greater than 0)
    let priceValue = Number(price.value);
    if (price.value.trim() === "") {
      showError(price, "Price is required.");
      valid = false;
    } else if (isNaN(priceValue) || priceValue <= 0) {
      showError(price, "Price must be a number greater than 0.");
      valid = false;
    } else {
      showSuccess(price);
    }

    // Warranty months validation (whole number 1 to 120)
    let monthsValue = Number(months.value);
    if (months.value.trim() === "") {
      showError(months, "Warranty months is required.");
      valid = false;
    } else if (!Number.isInteger(monthsValue) || monthsValue < 1 || monthsValue > 120) {
      showError(months, "Must be a whole number from 1 to 120.");
      valid = false;
    } else {
      showSuccess(months);
    }

    // Success
    if (valid) {
      let row;
      let message = "";

      if (editingProductRow === null) {
        row = addEmptyProductRow();
        message = name.value.trim() + " added to the catalogue";
      } else {
        row = editingProductRow;
        message = name.value.trim() + " updated";
      }

      row.cells[1].textContent = name.value.trim();
      row.cells[2].textContent = brand.value.trim();
      row.cells[3].textContent = model.value.trim();
      row.cells[4].textContent = category.value;
      row.cells[5].textContent = "৳ " + priceValue.toLocaleString("en-US");   // 89500 -> ৳ 89,500
      row.cells[5].setAttribute("data-value", priceValue);                      // plain number for Edit
      row.cells[6].textContent = monthsValue + " months";
      row.cells[6].setAttribute("data-value", monthsValue);

      resetProductForm();
      filterProducts();
      showMessage("productMsg", message, "success");
    }
  });

  // Cancel button
  document.getElementById("productCancel").addEventListener("click", resetProductForm);

  // Buttons inside the table
  document.querySelector("#productsTable tbody").addEventListener("click", function (event) {
    let button = event.target;
    if (button.tagName !== "BUTTON") {
      return;
    }

    let action = button.getAttribute("data-action");
    if (action === "edit") {
      editProduct(button);
    } else if (action === "delete") {
      deleteProduct(button);
    }
  });

  // Search box and filter
  let toolbar = document.querySelector('[data-table="productsTable"]');
  toolbar.querySelector(".admin-search").addEventListener("input", filterProducts);
  toolbar.querySelector('select[data-col="4"]').addEventListener("change", filterProducts);
}

// New row with an ID, 6 empty cells and the Edit/Delete buttons
function addEmptyProductRow() {
  let tbody = document.querySelector("#productsTable tbody");
  let row = tbody.insertRow();

  row.insertCell().textContent = nextProductId();
  for (let i = 0; i < 6; i++) {
    row.insertCell();
  }

  let actions = row.insertCell();
  actions.className = "admin-actions";
  actions.innerHTML =
    '<button type="button" class="btn btn-small" data-action="edit">Edit</button> ' +
    '<button type="button" class="btn btn-small admin-btn-danger" data-action="delete">Delete</button>';
  return row;
}

// Next ID: P-006 -> P-007
function nextProductId() {
  let max = 0;
  getRows("productsTable").forEach(function (row) {
    let number = Number(row.cells[0].textContent.replace("P-", ""));
    if (number > max) {
      max = number;
    }
  });
  return "P-" + String(max + 1).padStart(3, "0");
}

// true if another row already has this model
function modelExists(model) {
  let found = false;
  getRows("productsTable").forEach(function (row) {
    if (row !== editingProductRow && row.cells[3].textContent.toLowerCase() === model.toLowerCase()) {
      found = true;
    }
  });
  return found;
}

// Edit button: copy the row into the form
function editProduct(button) {
  let row = button.parentElement.parentElement;   // button -> td -> tr
  editingProductRow = row;

  document.getElementById("productName").value = row.cells[1].textContent;
  document.getElementById("productBrand").value = row.cells[2].textContent;
  document.getElementById("productModel").value = row.cells[3].textContent;
  document.getElementById("productCategory").value = row.cells[4].textContent;
  document.getElementById("productPrice").value = row.cells[5].getAttribute("data-value");
  document.getElementById("productMonths").value = row.cells[6].getAttribute("data-value");

  document.getElementById("productFormTitle").innerHTML = "Edit product (" + row.cells[0].textContent + ")";
  document.getElementById("productSubmit").innerHTML = "Update Product";
  clearErrors();
  productForm.scrollIntoView();
}

// Delete button (asks first)
function deleteProduct(button) {
  let row = button.parentElement.parentElement;
  let name = row.cells[1].textContent;

  if (confirm("Delete " + name + " from the catalogue?")) {
    if (row === editingProductRow) {
      resetProductForm();
    }
    row.remove();
    filterProducts();
    showMessage("productMsg", name + " was deleted", "success");
  }
}

// Cancel button (and after saving)
function resetProductForm() {
  productForm.reset();
  clearErrors();
  editingProductRow = null;
  document.getElementById("productFormTitle").innerHTML = "Add product";
  document.getElementById("productSubmit").innerHTML = "Add Product";
}

// Search box + category filter
function filterProducts() {
  let toolbar = document.querySelector('[data-table="productsTable"]');
  let search = toolbar.querySelector(".admin-search").value.trim().toLowerCase();
  let category = toolbar.querySelector('select[data-col="4"]').value;
  let shown = 0;

  getRows("productsTable").forEach(function (row) {
    let text = (row.cells[1].textContent + " " + row.cells[2].textContent + " " +
                row.cells[3].textContent).toLowerCase();
    let show = true;

    if (search !== "" && !text.includes(search)) {
      show = false;
    }
    if (category !== "" && row.cells[4].textContent !== category) {
      show = false;
    }

    if (show) {
      row.style.display = "";
      shown++;
    } else {
      row.style.display = "none";
    }
  });

  showEmptyRow("productsTable", shown);
}


/* =======================================================
   5. Claims Queue (admin_claims_queue.html)
   ======================================================= */
const claimsTable = document.getElementById("claimsTable");

if (claimsTable !== null) {
  updateClaimCounts();   // fill the 3 count cards when the page opens

  // Assign buttons inside the table
  document.querySelector("#claimsTable tbody").addEventListener("click", function (event) {
    let button = event.target;
    if (button.tagName === "BUTTON" && button.getAttribute("data-action") === "assign") {
      assignClaim(button);
    }
  });

  // Search box and filters
  let toolbar = document.querySelector('[data-table="claimsTable"]');
  toolbar.querySelector(".admin-search").addEventListener("input", filterClaims);
  toolbar.querySelector('select[data-col="5"]').addEventListener("change", filterClaims);
  toolbar.querySelector('select[data-col="6"]').addEventListener("change", filterClaims);
}

// Count Pending, Not assigned and In Service rows
function updateClaimCounts() {
  let pending = 0;
  let unassigned = 0;
  let inService = 0;

  getRows("claimsTable").forEach(function (row) {
    let status = row.cells[5].textContent.trim();
    let assignedTo = row.cells[6].textContent.trim();

    if (status === "Pending") {
      pending++;
      if (assignedTo === "Not assigned") {
        unassigned++;
      }
    }
    if (status === "In Service") {
      inService++;
    }
  });

  document.getElementById("countPending").innerHTML = pending;
  document.getElementById("countUnassigned").innerHTML = unassigned;
  document.getElementById("countService").innerHTML = inService;
}

// Assign button
function assignClaim(button) {
  let row = button.parentElement.parentElement;   // button -> td -> tr
  let select = row.querySelector("select");
  let claimId = row.cells[0].textContent;

  if (select.value === "") {
    showMessage("claimMsg", "Please select a technician for " + claimId + " first.", "error");
    select.focus();
    return;
  }

  row.cells[6].textContent = select.value;
  button.textContent = "Reassign";
  showMessage("claimMsg", claimId + " assigned to " + select.value, "success");
  updateClaimCounts();
  filterClaims();
}

// Search box + status filter + technician filter
function filterClaims() {
  let toolbar = document.querySelector('[data-table="claimsTable"]');
  let search = toolbar.querySelector(".admin-search").value.trim().toLowerCase();
  let status = toolbar.querySelector('select[data-col="5"]').value;
  let tech = toolbar.querySelector('select[data-col="6"]').value;
  let shown = 0;

  getRows("claimsTable").forEach(function (row) {
    let text = (row.cells[0].textContent + " " + row.cells[1].textContent + " " +
                row.cells[2].textContent).toLowerCase();
    let show = true;

    if (search !== "" && !text.includes(search)) {
      show = false;
    }
    if (status !== "" && row.cells[5].textContent.trim() !== status) {
      show = false;
    }
    if (tech !== "" && row.cells[6].textContent.trim() !== tech) {
      show = false;
    }

    if (show) {
      row.style.display = "";
      shown++;
    } else {
      row.style.display = "none";
    }
  });

  showEmptyRow("claimsTable", shown);
}


/* =======================================================
   6. Reports (admin_reports.html)
   Each row: <tr data-purchase="2024-12-05" data-months="24">
   JavaScript works out expiry date, days left and status.
   ======================================================= */
const expiryTable = document.getElementById("expiryTable");

if (expiryTable !== null) {
  getRows("expiryTable").forEach(function (row) {
    let purchase = new Date(row.getAttribute("data-purchase") + "T00:00:00");
    let months = Number(row.getAttribute("data-months"));
    let expiry = getExpiry(row);
    let days = daysLeft(expiry);

    row.cells[3].textContent = formatDate(purchase);
    row.cells[4].textContent = months + " months";
    row.cells[5].textContent = formatDate(expiry);

    if (days < 0) {
      row.cells[6].textContent = (-days) + " days ago";
    } else {
      row.cells[6].textContent = days + " days";
    }

    row.cells[7].innerHTML = statusBadge(days);
  });

  // Search box, status filter and date range
  let toolbar = document.querySelector('[data-table="expiryTable"]');
  toolbar.querySelector(".admin-search").addEventListener("input", filterReport);
  document.getElementById("statusFilter").addEventListener("change", filterReport);
  document.getElementById("expiryFrom").addEventListener("change", filterReport);
  document.getElementById("expiryTo").addEventListener("change", filterReport);

  // Reset button
  toolbar.querySelector("[data-reset]").addEventListener("click", function () {
    toolbar.querySelector(".admin-search").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("expiryFrom").value = "";
    document.getElementById("expiryTo").value = "";
    filterReport();
  });

  // Print button
  document.getElementById("printReport").addEventListener("click", function () {
    window.print();
  });
}

// Business rule: expiry date = purchase date + warranty months.
// 31 Jan + 1 month: there is no 31 Feb, so the last day of February is used.
function addMonths(date, months) {
  let result = new Date(date.getFullYear(), date.getMonth() + months, 1);                // 1st day of the new month
  let lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();     // last day of that month

  if (date.getDate() > lastDay) {
    result.setDate(lastDay);
  } else {
    result.setDate(date.getDate());
  }
  return result;
}

// Expiry date of one table row
function getExpiry(row) {
  let purchase = new Date(row.getAttribute("data-purchase") + "T00:00:00");
  let months = Number(row.getAttribute("data-months"));
  return addMonths(purchase, months);
}

// Days from today to the expiry date (negative = already expired)
function daysLeft(expiry) {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

// Business rule: Active (more than 30 days left), Expiring Soon (0 to 30), Expired (below 0)
function statusBadge(days) {
  if (days < 0) {
    return '<span class="badge badge-expired">Expired</span>';
  } else if (days <= 30) {
    return '<span class="badge badge-expiring">Expiring Soon</span>';
  } else {
    return '<span class="badge badge-active">Active</span>';
  }
}

// Date -> "05 Dec 2026"
function formatDate(date) {
  let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let day = date.getDate();
  if (day < 10) {
    day = "0" + day;
  }
  return day + " " + monthNames[date.getMonth()] + " " + date.getFullYear();
}

// Search box + status filter + expiry date range
function filterReport() {
  let search = document.querySelector('[data-table="expiryTable"] .admin-search').value.trim().toLowerCase();
  let status = document.getElementById("statusFilter").value;
  let fromValue = document.getElementById("expiryFrom").value;
  let toValue = document.getElementById("expiryTo").value;
  let shown = 0;

  getRows("expiryTable").forEach(function (row) {
    let text = (row.cells[0].textContent + " " + row.cells[1].textContent + " " +
                row.cells[2].textContent).toLowerCase();
    let expiry = getExpiry(row);
    let show = true;

    if (search !== "" && !text.includes(search)) {
      show = false;
    }
    if (status !== "" && row.cells[7].textContent !== status) {
      show = false;
    }
    if (fromValue !== "" && expiry < new Date(fromValue + "T00:00:00")) {
      show = false;
    }
    if (toValue !== "" && expiry > new Date(toValue + "T00:00:00")) {
      show = false;
    }

    if (show) {
      row.style.display = "";
      shown++;
    } else {
      row.style.display = "none";
    }
  });

  showEmptyRow("expiryTable", shown);
}