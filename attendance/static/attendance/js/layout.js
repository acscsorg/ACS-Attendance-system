/* ============================= NAV CONFIG ============================= */
const NAV = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "qr-generator", label: "QR Generator", icon: "qr" },
    { id: "students", label: "Student List", icon: "students" },
    { id: "events", label: "Events", icon: "events" },
    { id: "scanner", label: "QR Scanner", icon: "scanner" },
    { id: "device-log", label: "Device Audit Log", icon: "stats" },
    { id: "statistics", label: "Statistics", icon: "stats" },
    { id: "settings", label: "Semester Settings", icon: "settings" },
  ],
  officer: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "scanner", label: "QR Scanner", icon: "scanner" },
    { id: "device-log", label: "Device Audit Log", icon: "stats" },
    { id: "students", label: "Student List", icon: "students" },
    { id: "events", label: "Events", icon: "events" },
  ],
  student: [
    { id: "my-qr", label: "My QR Code", icon: "qr" },
    { id: "my-attendance", label: "My Attendance", icon: "dashboard" },
    { id: "events", label: "Upcoming Events", icon: "events" },
  ],
};
const PAGE_TITLES = {
  dashboard: "Dashboard",
  "qr-generator": "QR Code Generator",
  students: "Student List",
  events: "Events",
  scanner: "QR Scanner",
  "device-log": "Local Device Audit Log",
  statistics: "Statistics",
  settings: "Semester Settings",
  "my-qr": "My QR Code",
  "my-attendance": "My Attendance",
};

/* ============================= SIDEBAR UI ============================= */
let sidebarUiInitialized = false;

function openSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const hamburgerButton = document.querySelector(".hamburger-btn");

  if (!sidebar || !backdrop || !hamburgerButton) return;

  sidebar.classList.add("open");
  backdrop.classList.add("open");
  hamburgerButton.setAttribute("aria-expanded", "true");
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const backdrop = document.querySelector(".sidebar-backdrop");
  const hamburgerButton = document.querySelector(".hamburger-btn");

  if (!sidebar || !backdrop || !hamburgerButton) return;

  sidebar.classList.remove("open");
  backdrop.classList.remove("open");
  hamburgerButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sidebar-open");
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const hamburgerButton = document.querySelector(".hamburger-btn");

  if (!sidebar || !hamburgerButton) return;

  const isOpen = sidebar.classList.contains("open");
  if (isOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function initSidebarInteractions() {
  if (sidebarUiInitialized) return;

  document.addEventListener("click", (event) => {
    const hamburgerButton = event.target.closest(".hamburger-btn");
    const backdrop = event.target.closest(".sidebar-backdrop");
    const navItem = event.target.closest(".nav-item");
    const sidebar = document.querySelector(".sidebar");

    if (hamburgerButton) {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    if (backdrop) {
      closeSidebar();
      return;
    }

    if (navItem && sidebar && sidebar.contains(navItem)) {
      closeSidebar();
      return;
    }

    if (
      sidebar &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !event.target.closest(".hamburger-btn")
    ) {
      closeSidebar();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
    }
  });

  sidebarUiInitialized = true;
}

/* ============================= RENDER ROOT ============================= */
function render() {
  const app = document.getElementById("app");
  if (!state.ready) {
    app.innerHTML =
      '<div style="padding:40px;font-family:Inter">Loading AttendQR…</div>';
    return;
  }

  if (!state.auth) {
    app.innerHTML = renderLogin();
    afterRenderLogin();
    return;
  }

  state.role = state.auth.role || "admin";
  if (state.role === "officer" && state.auth.name) {
    state.officerName = state.auth.name;
  }
  if (state.role === "student" && state.auth.studentUid) {
    state.studentViewUid = state.auth.studentUid;
  }

  const nav = NAV[state.role] || NAV.admin;
  if (!nav.find((n) => n.id === state.page)) state.page = nav[0].id;

  app.innerHTML = `
    <div class="sidebar-backdrop" aria-hidden="true"></div>
    <div class="sidebar" id="sidebarMenu">
      <div class="brand">
        <img src="/static/attendance/icons/icon-192.png" class="brand-img" alt="ACS Logo">
        <div>
          <div class="brand-name">ACS Attendance</div>
          <div class="brand-sub">Organization Attendance</div>
        </div>
      </div>
      <div class="nav-group-label">Navigate</div>
      ${nav
        .map(
          (n) => `
        <div class="nav-item ${state.page === n.id ? "active" : ""}" data-nav="${n.id}">
          ${ICONS[n.icon]}<span>${n.label}</span>
        </div>`,
        )
        .join("")}
      <div class="nav-spacer"></div>
      <div class="role-box">
        <div class="role-label">Logged in as</div>
        <div style="font-size:13px;font-weight:600;color:#fff;">${esc(state.auth.name || state.auth.studentUid)}</div>
        <div style="font-size:11px;color:#7c86a8;text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">Role: ${esc(state.role)}</div>
      </div>
    </div>
    <div class="main">
      <div class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="sidebarMenu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div>
            <h1>${PAGE_TITLES[state.page]}</h1>
            <div class="meta">${state.settings.semester} · A.Y. ${state.settings.academicYear}${state.role === "student" ? " · " + (studentByUid(state.studentViewUid)?.name || "") : ""}${state.role === "officer" ? " · " + esc(state.officerName) : ""}</div>
          </div>
        </div>
        <div class="topbar-right no-print">
          <div id="syncBadgeContainer" style="display:inline-flex;align-items:center;"></div>
          <div class="user-chip">
            <span class="user-chip-role">${esc(state.role)}</span>
            <span class="user-chip-name">${esc(state.auth.name || state.auth.studentUid)}</span>
          </div>
          <button class="logout-btn" id="logoutBtn">Logout</button>
        </div>
      </div>
      <div class="content" id="pageContent"></div>
    </div>
  `;

  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.onclick = () => {
      state.page = el.dataset.nav;
      render();
    };
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("attendqr-auth");
      state.auth = null;
      stopScanner();
      render();
    };
  }

  initSidebarInteractions();
  closeSidebar();
  renderPage();
  updateSyncBadge();
}

function renderPage() {
  const c = document.getElementById("pageContent");
  const map = {
    dashboard: renderDashboard,
    "qr-generator": renderQrGenerator,
    students: renderStudents,
    events: renderEvents,
    scanner: renderScanner,
    "device-log": renderDeviceLogPage,
    statistics: renderStatistics,
    settings: renderSettings,
    "my-qr": renderMyQr,
    "my-attendance": renderMyAttendance,
  };
  c.innerHTML = map[state.page]
    ? map[state.page]()
    : '<div class="empty">Not found</div>';
  afterRender(state.page);
}

/* ============================= POST-RENDER WIRING ============================= */
function afterRender(page) {
  if (page !== "scanner") stopScanner();

  const handlers = {
    "dashboard": afterRenderDashboard,
    "qr-generator": afterRenderQrGenerator,
    "students": afterRenderStudents,
    "events": afterRenderEvents,
    "scanner": afterRenderScanner,
    "device-log": afterRenderDeviceLog,
    "statistics": afterRenderStatistics,
    "settings": afterRenderSettings,
    "my-qr": afterRenderMyQr,
    "my-attendance": afterRenderMyAttendance,
  };

  if (handlers[page]) handlers[page]();
}
