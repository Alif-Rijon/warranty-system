
(() => {
  "use strict";

  const KEYS = {
    USER: "warrantydesk_current_user",
    JOBS: "warrantydesk_assignments",
    LOGS: "warrantydesk_service_logs",
    PROFILES: "warrantydesk_technician_profiles"
  };

  const ALLOWED = [
    "Pending",
    "In Service",
    "Repaired",
    "Replaced",
    "Rejected",
    "Delivered"
  ];

  const $ = id => document.getElementById(id);

  const value = id => {
    const element = $(id);
    return element ? element.value.trim() : "";
  };

  const setText = (id, content) => {
    const element = $(id);

    if (element) {
      element.textContent = String(content ?? "");
    }
  };


  function readStorage(key, fallback, storage = localStorage) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function getUser() {
    const sessionUser = readStorage(
      KEYS.USER,
      null,
      sessionStorage
    );

    const savedUser = readStorage(
      KEYS.USER,
      null
    );

    const user = sessionUser || savedUser;

    if (!user || typeof user !== "object") {
      return null;
    }

    const email = String(user.email || "")
      .trim()
      .toLowerCase();

    const role = String(user.role || "")
      .trim()
      .toLowerCase();

    if (!email || role !== "technician") {
      return null;
    }

    return { email, role };
  }

  function getProfiles() {
    const data = readStorage(KEYS.PROFILES, {});
    return data && typeof data === "object" &&
      !Array.isArray(data) ? data : {};
  }

  function getLogStore() {
    const data = readStorage(KEYS.LOGS, {});
    return data && typeof data === "object" &&
      !Array.isArray(data) ? data : {};
  }

  function recordKey(email, claim) {
    return JSON.stringify([email, claim]);
  }

  function getJobLogs(job) {
    const user = getUser();
    if (!user) return [];

    const store = getLogStore();
    const data = store[recordKey(user.email, job.claim)];

    return Array.isArray(data) ? data : [];
  }


  function getJobs() {
    const user = getUser();

    // Never display another technician's jobs.
    if (!user) return [];

    const records = readStorage(KEYS.JOBS, []);

    if (!Array.isArray(records)) return [];

    return records
      .filter(job => {
        if (!job || typeof job !== "object") {
          return false;
        }

        if (!job.claim) return false;

        const assignedTo = String(
          job.assignedTo || ""
        ).trim().toLowerCase();

        return assignedTo === user.email;
      })
      .map(job => {
        const claim = String(job.claim);
        const logs = getJobLogs({ claim });

        const latest = logs.length
          ? logs[logs.length - 1]
          : null;

        return {
          claim,
          product: String(job.product || ""),
          serial: String(job.serial || ""),
          customer: String(job.customer || ""),
          problem: String(job.problem || ""),
          created: String(job.created || ""),
          status: latest && ALLOWED.includes(latest.status)
            ? latest.status
            : ALLOWED.includes(job.status)
              ? job.status
              : "Pending",
          logs
        };
      });
  }

  function findJob(claim) {
    return getJobs().find(job => job.claim === claim);
  }

  function formatDate(dateString) {
    if (!dateString) return "Not available";

    const date = new Date(dateString);

    return Number.isNaN(date.getTime())
      ? "Not available"
      : date.toLocaleString();
  }

  function claimLink(claim) {
    return "technician_service_log.html?claim=" +
      encodeURIComponent(claim);
  }

  function makeElement(tag, className = "", content = null) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (content !== null) {
      element.textContent = String(content);
    }

    return element;
  }

  function emptyRow(columns, message) {
    const row = document.createElement("tr");

    const cell = makeElement(
      "td",
      "technician-empty",
      message
    );

    cell.colSpan = columns;
    row.appendChild(cell);

    return row;
  }

  function statusBadge(status) {
    const validStatus = ALLOWED.includes(status)
      ? status
      : "Pending";

    const slug = validStatus
      .toLowerCase()
      .replace(/\s+/g, "-");

    return makeElement(
      "span",
      "technician-status technician-status-" + slug,
      validStatus
    );
  }

  function showError(id, message) {
    const control = $(id);

    setText(id + "-error", message);

    if (control) {
      const invalid = Boolean(message);

      control.classList.toggle(
        "technician-invalid",
        invalid
      );

      control.setAttribute(
        "aria-invalid",
        String(invalid)
      );
    }

    return !message;
  }

  function attachForm(id, handler) {
    const form = $(id);

    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();
      handler(form);
    });
  }

  function addTableRow(tbody, job, dashboard = false) {
    const row = document.createElement("tr");

    const fields = dashboard
      ? [job.claim, job.product, job.customer]
      : [
          job.claim,
          job.product,
          job.serial,
          job.customer,
          formatDate(job.created)
        ];

    fields.forEach(field => {
      row.appendChild(makeElement("td", "", field));
    });

    const statusCell = makeElement("td");
    statusCell.appendChild(statusBadge(job.status));
    row.appendChild(statusCell);

    const actionCell = makeElement("td");

    const link = makeElement(
      "a",
      "btn btn-small technician-table-link",
      dashboard ? "View" : "View Details"
    );

    link.href = claimLink(job.claim);

    actionCell.appendChild(link);
    row.appendChild(actionCell);

    tbody.appendChild(row);
  }

  function initDashboard() {
    const tbody = $("dashboard-jobs");

    if (!tbody) return;

    const jobs = getJobs();

    setText("count-all", jobs.length);

    setText(
      "count-service",
      jobs.filter(job =>
        job.status === "In Service"
      ).length
    );

    setText(
      "count-repaired",
      jobs.filter(job =>
        job.status === "Repaired"
      ).length
    );

    setText(
      "count-pending",
      jobs.filter(job =>
        job.status === "Pending"
      ).length
    );

    tbody.replaceChildren();

    if (!jobs.length) {
      tbody.appendChild(
        emptyRow(
          5,
          getUser()
            ? "No jobs have been assigned to you."
            : "Technician session is not available."
        )
      );
    } else {
      jobs
        .slice()
        .sort((a, b) =>
          (b.created || "").localeCompare(a.created || "")
        )
        .slice(0, 3)
        .forEach(job => {
          addTableRow(tbody, job, true);
        });
    }

    const timeline = $("dashboard-updates");

    if (!timeline) return;

    timeline.replaceChildren();

    const updates = jobs
      .flatMap(job =>
        job.logs.map(log => ({
          ...log,
          claim: job.claim
        }))
      )
      .sort((a, b) =>
        (b.timestamp || "").localeCompare(
          a.timestamp || ""
        )
      )
      .slice(0, 4);

    if (!updates.length) {
      timeline.appendChild(
        makeElement(
          "li",
          "technician-timeline-item",
          "No service activity recorded yet."
        )
      );
      return;
    }

    updates.forEach(log => {
      const item = makeElement(
        "li",
        "technician-timeline-item"
      );

      item.appendChild(
        makeElement(
          "span",
          "technician-timeline-date",
          formatDate(log.timestamp)
        )
      );

      item.appendChild(
        makeElement(
          "strong",
          "",
          log.claim + " — " + log.status
        )
      );

      item.appendChild(
        makeElement("p", "", log.diagnosis || "")
      );

      timeline.appendChild(item);
    });
  }

  function initJobs() {
    const tbody = $("jobs-body");

    if (!tbody) return;

    const search = $("jobs-search");
    const filter = $("jobs-status");

    function renderJobs() {
      const all = getJobs();

      const query = value("jobs-search").toLowerCase();

      const status = value("jobs-status");

      const filtered = all.filter(job => {
        const matchesStatus =
          !status || job.status === status;

        const searchable = [
          job.claim,
          job.product,
          job.serial,
          job.customer,
          job.problem
        ].join(" ").toLowerCase();

        return matchesStatus &&
          searchable.includes(query);
      });

      tbody.replaceChildren();

      if (!filtered.length) {
        const message = !getUser()
          ? "Technician session is not available."
          : !all.length
            ? "No assigned jobs available."
            : "No jobs match your search or filter.";

        tbody.appendChild(emptyRow(7, message));
      } else {
        filtered.forEach(job => {
          addTableRow(tbody, job);
        });
      }

      setText(
        "jobs-count",
        `Showing ${filtered.length} of ${all.length} jobs`
      );
    }

    if (search) {
      search.addEventListener("input", renderJobs);
    }

    if (filter) {
      filter.addEventListener("change", renderJobs);
    }

    renderJobs();

  
  }



  function initServiceLog() {
    const form = $("service-form");

    if (!form) return;

    const params = new URLSearchParams(
      window.location.search
    );

    const claimId = params.get("claim");

    const saveButton = $("service-save");

    const statusField = $("claim-status");
    const rejectionRow = $("rejection-row");
    const rejectionField = $("rejection-reason");

    function updateRejectionField() {
      const rejected = value("claim-status") === "Rejected";

      if (rejectionRow) {
        rejectionRow.classList.toggle(
          "technician-hidden",
          !rejected
        );

        rejectionRow.setAttribute(
          "aria-hidden",
          String(!rejected)
        );
      }

      if (rejectionField) {
        rejectionField.required = rejected;

        if (!rejected) {
          rejectionField.value = "";
          showError("rejection-reason", "");
        }
      }
    }

    if (statusField) {
      statusField.addEventListener(
        "change",
        updateRejectionField
      );
    }

    function renderClaim() {
      const job = claimId ? findJob(claimId) : null;

      if (!job) {
        setText("claim-title", "No Claim Selected");

        setText(
          "claim-subtitle",
          getUser()
            ? "Select a job from Assigned Jobs."
            : "Technician session is not available."
        );

        setText("claim-problem", "No claim selected.");

        if (saveButton) {
          saveButton.disabled = true;
        }

        const badge = $("claim-badge");
        if (badge) badge.replaceChildren();

        return;
      }

      if (saveButton) {
        saveButton.disabled = false;
      }

      setText("claim-title", "Claim #" + job.claim);

      setText(
        "claim-subtitle",
        [job.product, job.serial, job.customer]
          .filter(Boolean)
          .join(" · ")
      );

      setText(
        "claim-problem",
        job.problem || "No problem description available."
      );

      const badge = $("claim-badge");

      if (badge) {
        badge.replaceChildren(statusBadge(job.status));
      }

      const info = $("claim-info");

      if (info) {
        info.replaceChildren();

        const details = [
          ["Claim No.", job.claim],
          ["Product", job.product],
          ["Serial Number", job.serial],
          ["Customer", job.customer],
          ["Assigned Date", formatDate(job.created)],
          ["Current Status", job.status],
          ["Warranty Information", "Not available"]
        ];

        details.forEach(([label, data]) => {
          info.appendChild(
            makeElement("dt", "", label)
          );

          info.appendChild(
            makeElement("dd", "", data || "Not available")
          );
        });
      }

      // Service history
      const history = $("service-history");

      if (history) {
        history.replaceChildren();

        const logs = job.logs
          .slice()
          .sort((a, b) =>
            (b.timestamp || "").localeCompare(
              a.timestamp || ""
            )
          );

        if (!logs.length) {
          history.appendChild(
            makeElement(
              "li",
              "technician-timeline-item",
              "No service logs recorded."
            )
          );
        }

        logs.forEach(log => {
          const item = makeElement(
            "li",
            "technician-timeline-item"
          );

          item.appendChild(
            makeElement(
              "span",
              "technician-timeline-date",
              formatDate(log.timestamp)
            )
          );

          item.appendChild(
            makeElement("strong", "", log.status)
          );

          item.appendChild(
            makeElement(
              "p",
              "",
              "Diagnosis: " + (log.diagnosis || "")
            )
          );

          item.appendChild(
            makeElement(
              "p",
              "",
              "Repair Action / Parts: " + (log.repair || "")
            )
          );

          if (log.reason) {
            item.appendChild(
              makeElement(
                "p",
                "",
                "Rejection Reason: " + log.reason
              )
            );
          }

          history.appendChild(item);
        });
      }

      if (statusField) {
        statusField.value = job.status;
      }

      updateRejectionField();
    }

    renderClaim();

    attachForm("service-form", () => {
      const user = getUser();
      const job = claimId ? findJob(claimId) : null;

      if (!user || !job) {
        setText(
          "service-success",
          "A valid assigned claim is required."
        );
        return;
      }

      const diagnosis = value("diagnosis");
      const repair = value("repair-action");
      const status = value("claim-status");
      const reason = value("rejection-reason");

      const checks = [
        showError(
          "diagnosis",
          diagnosis ? "" : "Enter a diagnosis."
        ),

        showError(
          "repair-action",
          repair ? "" : "Enter the repair action."
        ),

        showError(
          "claim-status",
          ALLOWED.includes(status)
            ? ""
            : "Select a valid status."
        ),

        showError(
          "rejection-reason",
          status === "Rejected" && !reason
            ? "A rejection reason is required."
            : ""
        )
      ];

      if (!checks.every(Boolean)) {
        setText("service-success", "");
        return;
      }

      const store = getLogStore();
      const key = recordKey(user.email, job.claim);

      const entries = Array.isArray(store[key])
        ? store[key].slice()
        : [];

      entries.push({
        timestamp: new Date().toISOString(),
        diagnosis,
        repair,
        status,
        reason: status === "Rejected" ? reason : ""
      });

      store[key] = entries;

      if (!saveStorage(KEYS.LOGS, store)) {
        setText(
          "service-success",
          "Unable to save the service log in this browser."
        );
        return;
      }

      form.reset();
      renderClaim();

      setText(
        "service-success",
        "Service log saved locally. Database synchronization is not configured."
      );
    });
  }

  function initProfile() {
    const form = $("profile-form");

    if (!form) return;

    const user = getUser();
    const photoInput = $("profile-photo");

    let photoData = "";

    function showPhoto(source) {
      const img = $("profile-image");
      const placeholder = $("profile-placeholder");

      if (!img || !source) return;

      img.src = source;
      img.hidden = false;

      img.classList.remove("technician-hidden");

      if (placeholder) {
        placeholder.classList.add("technician-hidden");
      }
    }

    if (user) {
      const profiles = getProfiles();
      const stored = profiles[user.email] || {};

      if ($("profile-email")) {
        $("profile-email").value = user.email;
      }

      if ($("profile-name")) {
        $("profile-name").value = stored.name || "";
      }

      if ($("profile-phone")) {
        $("profile-phone").value = stored.phone || "";
      }

      if ($("profile-address")) {
        $("profile-address").value = stored.address || "";
      }

      if (stored.photo) {
        photoData = stored.photo;
        showPhoto(photoData);
      }
    }

    if (photoInput) {
      photoInput.addEventListener("change", () => {
        const file = photoInput.files?.[0];

        if (!file) return;

        const allowedTypes = [
          "image/png",
          "image/jpeg",
          "image/webp"
        ];

        if (
          !allowedTypes.includes(file.type) ||
          file.size > 2 * 1024 * 1024
        ) {
          showError(
            "profile-photo",
            "Use PNG, JPG or WEBP under 2 MB."
          );

          photoInput.value = "";
          return;
        }

        showError("profile-photo", "");

        const reader = new FileReader();

        reader.onload = () => {
          photoData = String(reader.result || "");
          showPhoto(photoData);
        };

        reader.readAsDataURL(file);
      });
    }

    attachForm("profile-form", () => {
      const name = value("profile-name");
      const phone = value("profile-phone");
      const address = value("profile-address");

      const checks = [
        showError(
          "profile-name",
          name ? "" : "Enter your full name."
        ),

        showError(
          "profile-phone",
          /^01[3-9]\d{8}$/.test(phone)
            ? ""
            : "Enter a valid 11-digit Bangladesh mobile number."
        ),

        showError(
          "profile-address",
          address ? "" : "Enter your address."
        )
      ];

      if (!checks.every(Boolean)) {
        setText("profile-success", "");
        return;
      }

      if (!user) {
        setText(
          "profile-success",
          "Technician session is not available. Profile was not saved."
        );
        return;
      }

      const profiles = getProfiles();

      profiles[user.email] = {
        name,
        phone,
        address,
        photo: photoData
      };

      if (!saveStorage(KEYS.PROFILES, profiles)) {
        setText(
          "profile-success",
          "Unable to save profile. Browser storage may be full."
        );
        return;
      }

      setText(
        "profile-success",
        "Profile saved locally in this browser."
      );
    });
  }

  function initChangePassword() {
    attachForm("password-form", () => {
      const current = $("current-password");
      const next = $("new-password");
      const confirm = $("confirm-password");

      if (!current || !next || !confirm) return;

      const checks = [
        showError(
          "current-password",
          current.value
            ? ""
            : "Enter your current password."
        ),

        showError(
          "new-password",
          next.value.length >= 8
            ? ""
            : "Password must contain at least 8 characters."
        ),

        showError(
          "confirm-password",
          confirm.value && confirm.value === next.value
            ? ""
            : "Passwords do not match."
        )
      ];

      if (!checks.every(Boolean)) {
        setText("password-success", "");
        return;
      }

      setText(
        "password-success",
        "Password fields validated. No password was changed. Administrator or backend verification is required."
      );
    });
  }


  function initForgotPassword() {
    attachForm("forgot-form", () => {
      const email = $("forgot-email");

      if (!email) return;

      const valid =
        email.validity.valid &&
        email.value.trim() !== "";

      showError(
        "forgot-email",
        valid ? "" : "Enter a valid email address."
      );

      if (!valid) {
        setText("forgot-success", "");
        return;
      }

      setText(
        "forgot-success",
        "Email format validated. Contact the administrator for password recovery. No reset request has been sent."
      );
    });
  }

  function initialize() {
    initDashboard();
    initJobs();
    initServiceLog();
    initProfile();
    initChangePassword();
    initForgotPassword();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }

})();
