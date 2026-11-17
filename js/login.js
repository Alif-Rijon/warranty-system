const form = document.getElementById("loginForm");
const demoPassword = "123456";

// index.html opens "login.html?role=admin" -> put the demo email in the box
let params = new URLSearchParams(window.location.search);
let roleFromLink = params.get("role");
if (roleFromLink !== null) {
  document.getElementById("loginEmail").value = roleFromLink + "@warrantydesk.com";
}

form.addEventListener("submit", function (event) {
  event.preventDefault();   // stops page reload on submit
  clearErrors();

  let email = document.getElementById("loginEmail");
  let password = document.getElementById("loginPassword");

  let valid = true;

  // Email validation
  if (email.value.trim() === "") {
    showError(email, "loginEmailError", "Email is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    showError(email, "loginEmailError", "Enter a valid email address.");
    valid = false;
  } else {
    showSuccess(email);
  }

  // Password validation
  if (password.value === "") {
    showError(password, "loginPasswordError", "Password is required.");
    valid = false;
  } else if (password.value.length < 6) {
    showError(password, "loginPasswordError", "Password must be at least 6 characters.");
    valid = false;
  } else {
    showSuccess(password);
  }

  // Success: check the demo account and open the right dashboard
  if (valid) {
    let dashboard = getDashboard(email.value.trim().toLowerCase());

    if (dashboard === "" || password.value !== demoPassword) {
      showError(password, "loginPasswordError", "Wrong email or password.");
    } else {
      window.location.href = dashboard;   // go to that role's dashboard
    }
  }
});

// ---------- Functions ----------

// Which dashboard belongs to each demo email ("" = no such account)
function getDashboard(email) {
  if (email === "admin@warrantydesk.com") {
    return "admin_dashboard.html";
  } else if (email === "officer@warrantydesk.com") {
    return "officer_dashboard.html";
  } else if (email === "technician@warrantydesk.com") {
    return "technician_dashboard.html";
  } else if (email === "customer@warrantydesk.com") {
    return "customer_dashboard.html";
  } else {
    return "";
  }
}

// Show error
function showError(input, errorId, message) {
  input.classList.add("login-error-border");
  input.classList.remove("login-success-border");
  document.getElementById(errorId).innerHTML = message;
}

// Show success
function showSuccess(input) {
  input.classList.remove("login-error-border");
  input.classList.add("login-success-border");
}

// Clear all errors
function clearErrors() {
  let errors = document.querySelectorAll(".login-error");
  errors.forEach(function (item) {
    item.innerHTML = "";
  });

  let fields = document.querySelectorAll("input");
  fields.forEach(function (field) {
    field.classList.remove("login-error-border");
    field.classList.remove("login-success-border");
  });
}