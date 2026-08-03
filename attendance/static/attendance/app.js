/* ============================= ICONS ============================= */
const ICONS = {
  dashboard:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>',
  students:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="18" cy="8.5" r="2.4"/><path d="M15.7 14.3c2.6.4 4.8 2.4 4.8 5.7"/></svg>',
  events:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  scanner:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M3 12h18"/></svg>',
  stats:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M11 20V4M18 20v-7"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.6.7 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
};

/* ============================= STATE ============================= */
let state = {
  auth: (function() {
    try { return JSON.parse(localStorage.getItem('attendqr-auth')); } catch(e){ return null; }
  })(),
  loginTab: 'student',
  role: "admin",
  page: "dashboard",
  officerName: null,
  studentViewUid: null,
  students: [],
  events: [],
  attendance: [],
  officers: ["Officer J. Reyes", "Officer M. Santos", "Officer A. Cruz"],
  settings: { semester: "First Semester", academicYear: "2026-2027", adminUsername: "admin" },
  ready: false,
  scannerEventId: null,
  scannerActive: false,
  lastScan: null,
  recentScans: [],
  stuPage: 1,
};
let html5QrInstance = null;
let scanCooldown = false;

const COURSES = ["BS Computer Science"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SECTIONS = ["1", "2", "3"];

/* ============================= PERSISTENCE & API SYNC ============================= */
async function loadData() {
  try {
    const [studentsRes, eventsRes, attendanceRes, settingsRes] =
      await Promise.all([
        fetch("/api/students/").then((r) => r.json()),
        fetch("/api/events/").then((r) => r.json()),
        fetch("/api/attendance/").then((r) => r.json()),
        fetch("/api/settings/").then((r) => r.json()),
      ]);

    state.students = (studentsRes || []).map((s) => ({
      id: s.id,
      uid: s.uid,
      studentNumber: s.student_number,
      name: s.name,
      course: s.course,
      year: s.year,
      section: s.section,
      status: s.status,
    }));

    state.events = (eventsRes || []).map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      venue: e.venue,
      description: e.description,
      status: e.status,
    }));

    state.attendance = (attendanceRes || []).map((a) => ({
      id: a.id,
      studentUid: a.student_uid,
      eventId: a.event_id,
      timestamp: a.timestamp,
      officer: a.officer,
    }));

    if (settingsRes && settingsRes.academic_year) {
      state.settings = {
        academicYear: settingsRes.academic_year,
        semester: settingsRes.semester,
        adminUsername: settingsRes.admin_username || 'admin',
      };
    }

    if (!state.students.length && !state.events.length) {
      await seedToBackend();
      return loadData();
    }
  } catch (e) {
    console.error("Error fetching data from Django API:", e);
  }
  state.ready = true;
  if (state.students.length) state.studentViewUid = state.students[0].uid;
  if (state.officers.length) state.officerName = state.officers[0];
  render();
}

async function persist() {
  // Local persistence backup
  try {
    const dataStr = JSON.stringify({
      students: state.students,
      events: state.events,
      attendance: state.attendance,
      settings: state.settings,
      officers: state.officers,
    });
    if (window.localStorage) localStorage.setItem("attendqr-data", dataStr);
  } catch (e) {}
}

async function seedToBackend() {
  const names = [
    "Ana Dela Cruz",
    "Miguel Santos",
    "Bea Reyes",
    "Carlo Mendoza",
    "Diana Flores",
    "Ethan Cruz",
    "Fiona Garcia",
    "Gabriel Torres",
    "Hannah Ramos",
    "Ivan Bautista",
    "Jasmine Villanueva",
    "Kyle Aquino",
    "Liza Domingo",
    "Marco Pascual",
    "Nadia Rivera",
    "Oscar Castillo",
    "Paula Navarro",
    "Quinn Salazar",
  ];
  const studentsToCreate = names.map((n, i) => ({
    uid: "ST-2026-" + String(i + 1).padStart(4, "0"),
    student_number: "21-" + String(1000 + i),
    name: n,
    course: COURSES[i % COURSES.length],
    year: YEARS[i % YEARS.length],
    section: SECTIONS[i % SECTIONS.length],
    status: i === 15 ? "Inactive" : "Active",
  }));

  for (const s of studentsToCreate) {
    await fetch("/api/students/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
  }

  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const past1 = new Date(today);
  past1.setDate(today.getDate() - 21);
  const past2 = new Date(today);
  past2.setDate(today.getDate() - 7);
  const upcoming = new Date(today);
  upcoming.setDate(today.getDate() + 10);

  const eventsToCreate = [
    {
      name: "General Assembly",
      date: fmt(past1),
      time: "09:00:00",
      venue: "Main Auditorium",
      description: "Semestral general assembly for all members.",
      status: "Closed",
    },
    {
      name: "Leadership Workshop",
      date: fmt(past2),
      time: "13:00:00",
      venue: "Function Hall B",
      description: "Workshop on officer leadership skills.",
      status: "Closed",
    },
    {
      name: "Org Week Kickoff",
      date: fmt(today),
      time: "10:00:00",
      venue: "Covered Court",
      description: "Opening program for organization week.",
      status: "Open",
    },
    {
      name: "General Assembly Pt. 2",
      date: fmt(upcoming),
      time: "09:00:00",
      venue: "Main Auditorium",
      description: "Follow-up assembly to close the semester.",
      status: "Open",
    },
  ];

  for (const e of eventsToCreate) {
    await fetch("/api/events/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
  }
}
function mkAtt(uid, eventId, dateObj, officer) {
  const d = new Date(dateObj);
  d.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 59));
  return {
    id: "AT-" + Math.random().toString(36).slice(2, 9),
    studentUid: uid,
    eventId,
    timestamp: d.toISOString(),
    officer,
  };
}
function makeUid(n) {
  return (
    "ST-" + state?.settings?.academicYear?.slice(0, 4) ||
    2026 + "-" + String(n).padStart(4, "0")
  );
}
function newUid() {
  const seq = state.students.length + 1;
  const yr = (state.settings.academicYear || "2026").slice(0, 4);
  return "ST-" + yr + "-" + String(seq).padStart(4, "0");
}

/* ============================= HELPERS ============================= */
function toast(msg, kind) {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = "toast" + (kind ? " " + kind : "");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function activeStudents() {
  return state.students.filter((s) => s.status === "Active");
}
function studentByUid(uid) {
  return state.students.find((s) => s.uid === uid);
}
function eventById(id) {
  return state.events.find((e) => String(e.id) === String(id));
}
function attendanceForEvent(id) {
  return state.attendance.filter((a) => String(a.eventId) === String(id));
}
function attendanceForStudent(uid) {
  return state.attendance.filter((a) => a.studentUid === uid);
}
function studentAttendancePct(uid) {
  const total = state.events.length || 1;
  return Math.round((attendanceForStudent(uid).length / total) * 100);
}
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function toCSV(rows, headers) {
  const esc2 = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc2).join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => esc2(r[h])).join(",")));
  return lines.join("\n");
}
function beep(kind) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    if (kind === "ok") {
      o.frequency.value = 880;
      g.gain.value = 0.06;
      o.start();
      setTimeout(() => {
        o.frequency.value = 1320;
      }, 80);
    } else if (kind === "dup") {
      o.frequency.value = 500;
      g.gain.value = 0.06;
      o.start();
    } else {
      o.frequency.value = 220;
      g.gain.value = 0.07;
      o.type = "sawtooth";
      o.start();
    }
    setTimeout(() => {
      g.gain.value = 0;
      o.stop();
      ctx.close();
    }, 220);
  } catch (e) {}
}

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

/* ============================= NAV CONFIG ============================= */
const NAV = {
  admin: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "qr-generator", label: "QR Generator", icon: "qr" },
    { id: "students", label: "Student List", icon: "students" },
    { id: "events", label: "Events", icon: "events" },
    { id: "scanner", label: "QR Scanner", icon: "scanner" },
    { id: "statistics", label: "Statistics", icon: "stats" },
    { id: "settings", label: "Semester Settings", icon: "settings" },
  ],
  officer: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "scanner", label: "QR Scanner", icon: "scanner" },
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
  statistics: "Statistics",
  settings: "Semester Settings",
  "my-qr": "My QR Code",
  "my-attendance": "My Attendance",
};

/* ============================= LOGIN PORTAL ============================= */
function renderLogin() {
  state.loginTab = state.loginTab || "student";
  const activeTab = state.loginTab;

  return `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">ACS</div>
        <h2>ACS Attendance</h2>
        <div class="login-sub">Association of Computer Scientists Portal</div>
      </div>

      <div class="login-tabs">
        <button type="button" class="login-tab ${activeTab === 'student' ? 'active' : ''}" data-login-tab="student">Student</button>
        <button type="button" class="login-tab ${activeTab === 'officer' ? 'active' : ''}" data-login-tab="officer">Officer</button>
        <button type="button" class="login-tab ${activeTab === 'admin' ? 'active' : ''}" data-login-tab="admin">Admin</button>
      </div>

      <form id="loginForm">
        ${
          activeTab === 'student'
            ? `
          <div class="field">
            <label>Student UID or Student No.</label>
            <input class="input" id="loginIdentifier" placeholder="e.g. ST-2026-0001 or 21-1000" autofocus required>
          </div>
          <div class="demo-hints">
            <span style="font-size:11px;color:var(--slate);display:block;margin-bottom:4px;">Quick Demo Select:</span>
            ${activeStudents().slice(0, 3).map(s => `<button type="button" class="demo-chip" data-quick-stu="${esc(s.uid)}">${esc(s.name)} (${esc(s.uid)})</button>`).join('')}
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Student</button>
        `
            : activeTab === 'officer'
            ? `
          <div class="field">
            <label>Select Officer Account</label>
            <select class="select" id="loginOfficerName">
              ${state.officers.map(o => `<option>${esc(o)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Officer PIN</label>
            <input type="password" class="input" id="loginOfficerPin" placeholder="Default PIN: 1234" value="1234" required>
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Officer</button>
        `
            : `
          <div class="field">
            <label>Admin Username</label>
            <input class="input" id="loginAdminUser" placeholder="Enter username" value="${esc(state.settings.adminUsername || 'admin')}" required>
          </div>
          <div class="field">
            <label>Admin Password</label>
            <input type="password" class="input" id="loginAdminPass" placeholder="Enter password" value="admin123" required>
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Admin</button>
        `
        }
      </form>
    </div>
  </div>
  `;
}

function afterRenderLogin() {
  document.querySelectorAll("[data-login-tab]").forEach((btn) => {
    btn.onclick = () => {
      state.loginTab = btn.dataset.loginTab;
      render();
    };
  });

  document.querySelectorAll("[data-quick-stu]").forEach((chip) => {
    chip.onclick = () => {
      const inp = document.getElementById("loginIdentifier");
      if (inp) inp.value = chip.dataset.quickStu;
    };
  });

  const form = document.getElementById("loginForm");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const tab = state.loginTab;
    let payload = { role: tab };

    if (tab === "student") {
      const iden = document.getElementById("loginIdentifier").value.trim();
      if (!iden) return;
      payload.identifier = iden;
    } else if (tab === "officer") {
      payload.username = document.getElementById("loginOfficerName").value;
      payload.pin = document.getElementById("loginOfficerPin").value.trim();
    } else if (tab === "admin") {
      payload.username = document.getElementById("loginAdminUser").value.trim();
      payload.password = document.getElementById("loginAdminPass").value.trim();
    }

    try {
      const res = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        state.auth = {
          role: data.role,
          name: data.name || (data.student ? data.student.name : "User"),
          studentUid: data.student ? data.student.uid : null,
        };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = data.role;
        state.page = NAV[data.role][0].id;
        toast(`Logged in successfully as ${state.auth.name}`, "ok");
        render();
      } else {
        toast(data.message || "Login failed", "err");
      }
    } catch (err) {
      toast("Connection error during login", "err");
    }
  };
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
        <div class="brand-mark">ACS</div>
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

/* ============================= DASHBOARD ============================= */
function renderDashboard() {
  const totalStudents = activeStudents().length;
  const totalOfficers = state.officers.length;
  const totalEvents = state.events.length;
  const focusEvents = state.events;
  if (!state.dashEventId || !eventById(state.dashEventId))
    state.dashEventId = (
      state.events.find((e) => e.status === "Open") || state.events[0]
    )?.id;
  const ev = eventById(state.dashEventId);
  const present = ev ? attendanceForEvent(ev.id).length : 0;
  const absent = Math.max(totalStudents - present, 0);
  const pct = totalStudents ? Math.round((present / totalStudents) * 100) : 0;

  const byYear = YEARS.map((y) => ({
    label: y,
    value: activeStudents().filter((s) => s.year === y).length,
  }));
  const trend = state.events.map((e) => ({
    label: e.name.split(" ")[0],
    value: attendanceForEvent(e.id).length,
  }));
  const recent = [...state.attendance]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  return `
  <div class="stat-grid">
    ${statCard("Total Students", totalStudents, activeStudents().length + " active enrolled")}
    ${statCard("Total Officers", totalOfficers, "On scanning duty")}
    ${statCard("Total Events", totalEvents, state.events.filter((e) => e.status === "Open").length + " currently open")}
    ${statCard("Attendance Rate", pct + "%", ev ? esc(ev.name) : "—")}
  </div>
  <div class="grid-2">
    <div class="panel">
      <div class="panel-head">
        <h3>Event Snapshot</h3>
        <select class="select" id="dashEventSelect">
          ${focusEvents.map((e) => `<option value="${e.id}" ${String(e.id) === String(state.dashEventId) ? "selected" : ""}>${esc(e.name)}</option>`).join("")}
        </select>
      </div>
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;">
        ${svgDonut(present, totalStudents)}
        <div style="flex:1;min-width:140px;">
          <div class="chart-legend" style="flex-direction:column;gap:9px;">
            <div><span class="legend-dot" style="background:var(--forest)"></span>Present — <b>${present}</b></div>
            <div><span class="legend-dot" style="background:var(--rust-tint);border:1px solid var(--rust)"></span>Absent — <b>${absent}</b></div>
            <div style="color:var(--slate);margin-top:4px;">${totalStudents} active students expected</div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Students by Year Level</h3></div>
      ${svgHBar(byYear)}
    </div>
  </div>
  <div class="grid-2">
    <div class="panel">
      <div class="panel-head"><h3>Attendance Trend by Event</h3></div>
      ${svgVBar(trend)}
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Recent Activity</h3></div>
      ${
        recent.length
          ? recent
              .map((a) => {
                const s = studentByUid(a.studentUid);
                const e = eventById(a.eventId);
                return `<div class="recent-scan-row">
          <div><b>${esc(s?.name || "Unknown")}</b><div style="color:var(--slate)">${esc(e?.name || "")}</div></div>
          <div style="text-align:right;color:var(--slate)">${fmtTime(a.timestamp)}<div>${fmtDate(a.timestamp)}</div></div>
        </div>`;
              })
              .join("")
          : '<div class="empty">No attendance recorded yet.</div>'
      }
    </div>
  </div>
  `;
}
function statCard(label, value, sub) {
  return `<div class="stat-card"><div class="accent-bar"></div><div class="eyebrow">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;
}
function svgDonut(present, total) {
  const r = 46,
    c = 2 * Math.PI * r;
  const pct = total ? present / total : 0;
  const off = c * (1 - pct);
  return `<svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#F6E1DB" stroke-width="14"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="#2F6B4F" stroke-width="14" stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round" transform="rotate(-90 60 60)"/>
    <text x="60" y="65" text-anchor="middle" font-family="Space Grotesk" font-size="22" font-weight="700" fill="#151E33">${Math.round(pct * 100)}%</text>
  </svg>`;
}
function svgHBar(data, isPercent = false) {
  if (!data || !data.length)
    return '<div class="empty">No data available.</div>';
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelWidth = 150;
  const maxBarW = 200;
  const totalWidth = labelWidth + maxBarW + 70;
  const rowH = 32;
  const height = data.length * rowH + 8;

  return `<svg width="100%" viewBox="0 0 ${totalWidth} ${height}" style="max-width:100%;">
    ${data
      .map((d, i) => {
        const y = i * rowH;
        const w = Math.max(4, (d.value / max) * maxBarW);
        const displayLabel =
          d.label.length > 20 ? d.label.slice(0, 18) + "…" : d.label;
        const valStr = isPercent ? d.value + "%" : d.value;
        return `<g>
        <title>${esc(d.label)}: ${valStr}</title>
        <text x="0" y="${y + 19}" font-size="12" fill="#151E33" font-family="Inter">${esc(displayLabel)}</text>
        <rect x="${labelWidth}" y="${y + 6}" width="${w}" height="16" rx="4" fill="#C89B3C"/>
        <text x="${labelWidth + w + 8}" y="${y + 18}" font-size="12" font-weight="600" fill="#5B6478">${valStr}</text>
      </g>`;
      })
      .join("")}
  </svg>`;
}
function svgVBar(data) {
  if (!data.length) return '<div class="empty">No events yet.</div>';
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 64,
    gap = 22,
    height = 150,
    chartW = data.length * (w + gap);
  return `<svg width="100%" viewBox="0 0 ${chartW} ${height + 30}" style="max-width:${chartW}px">
    ${data
      .map((d, i) => {
        const x = i * (w + gap);
        const barH = Math.max(4, (d.value / max) * height);
        return `<rect x="${x}" y="${height - barH + 10}" width="${w}" height="${barH}" rx="6" fill="#151E33"/>
      <text x="${x + w / 2}" y="${height - barH + 2}" text-anchor="middle" font-size="12" font-weight="600" fill="#151E33">${d.value}</text>
      <text x="${x + w / 2}" y="${height + 26}" text-anchor="middle" font-size="11" fill="#5B6478">${esc(d.label)}</text>`;
      })
      .join("")}
  </svg>`;
}

/* ============================= QR GENERATOR ============================= */
function renderQrGenerator() {
  if (!state.qrUid || !studentByUid(state.qrUid))
    state.qrUid = activeStudents()[0]?.uid;
  const s = studentByUid(state.qrUid);
  return `
  <div class="panel no-print">
    <div class="panel-head">
      <h3>Generate Student Badge</h3>
      <div class="hint">QR encodes the Student UID only, for security</div>
    </div>
    <div class="toolbar">
      <div class="search-wrap">${ICONS.search}<input class="input" id="qrSearch" placeholder="Search student by name or UID…"></div>
    </div>
    <div id="qrSingle"></div>
  </div>
  <div class="panel">
    <div class="panel-head">
      <h3>Bulk Badges — All Active Students</h3>
      <button class="btn btn-brass no-print" id="printAllBtn">Print All Badges</button>
    </div>
    <div class="badge-grid" id="bulkBadges"></div>
  </div>
  `;
}
function badgeCard(s, prefix = "qrimg-") {
  const idPart = prefix + s.uid.replace(/[^a-zA-Z0-9]/g, "");
  return `<div class="badge">
    <div class="badge-top">
      <div class="org">AttendQR · Campus ID</div>
      <div class="name">${esc(s.name)}</div>
      <div class="role">${esc(s.course)} · ${esc(s.year)}</div>
      <div class="badge-hole"></div>
    </div>
    <div class="badge-body" style="padding-top:22px;">
      <div class="badge-qr" id="${idPart}"></div>
      <div class="badge-info">
        <div class="uid">${esc(s.uid)}</div>
        <div>${esc(s.studentNumber)}</div>
        <div>Sec. ${esc(s.section)}</div>
      </div>
    </div>
    <div class="badge-actions no-print">
      <button class="btn btn-sm" data-dl="${idPart}" data-uid="${esc(s.uid)}">Download</button>
    </div>
  </div>`;
}

/* ============================= STUDENTS ============================= */
function renderStudents() {
  const canEdit = state.role === "admin";
  state.stuSearch = state.stuSearch || "";
  state.stuSort = state.stuSort || { key: "name", dir: 1 };
  state.stuPage = state.stuPage || 1;
  const perPage = 10;

  let list = state.students.filter((s) => {
    const q = state.stuSearch.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.uid.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });
  if (state.stuYearFilter)
    list = list.filter((s) => s.year === state.stuYearFilter);
  if (state.stuStatusFilter)
    list = list.filter((s) => s.status === state.stuStatusFilter);
  list.sort((a, b) => {
    const k = state.stuSort.key;
    const d = state.stuSort.dir;
    return String(a[k]).localeCompare(String(b[k])) * d;
  });

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  if (state.stuPage > totalPages) state.stuPage = totalPages;
  if (state.stuPage < 1) state.stuPage = 1;

  const startIndex = (state.stuPage - 1) * perPage;
  const paginatedList = list.slice(startIndex, startIndex + perPage);

  return `
  <div class="panel no-print">
    <div class="panel-head">
      <h3>${canEdit ? "All Students" : "Student Roster"}</h3>
      <div style="display:flex;gap:8px;">
        ${canEdit ? `<label class="btn btn-sm">Import CSV<input type="file" accept=".csv" id="importCsv" style="display:none"></label>` : ""}
        <button class="btn btn-sm" id="exportStudentsBtn">Export CSV</button>
        ${canEdit ? `<button class="btn btn-brass btn-sm" id="addStudentBtn">+ Add Student</button>` : ""}
      </div>
    </div>
    ${!canEdit ? `<div class="hint" style="margin-bottom:12px;">View only — officers cannot add, edit, or remove student records.</div>` : ""}
    <div class="toolbar">
      <div class="search-wrap">${ICONS.search}<input class="input" id="stuSearchInput" placeholder="Search name, UID, or student no." value="${esc(state.stuSearch)}"></div>
      <select class="select" id="stuYearFilter"><option value="">All Years</option>${YEARS.map((y) => `<option ${state.stuYearFilter === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      <select class="select" id="stuStatusFilter"><option value="">All Status</option><option ${state.stuStatusFilter === "Active" ? "selected" : ""}>Active</option><option ${state.stuStatusFilter === "Inactive" ? "selected" : ""}>Inactive</option></select>
    </div>
    <div class="table-wrap">
    <table>
      <thead><tr>
        <th data-sort="uid">UID</th><th data-sort="studentNumber">Student No.</th><th data-sort="name">Name</th>
        <th data-sort="course">Course</th><th data-sort="year">Year</th><th data-sort="section">Section</th>
        <th data-sort="status">Status</th><th>Attendance</th>${canEdit ? "<th></th>" : ""}
      </tr></thead>
      <tbody>
      ${
        paginatedList.length
          ? paginatedList
              .map(
                (s) => `
        <tr>
          <td><span class="uid-chip">${esc(s.uid)}</span></td>
          <td>${esc(s.studentNumber)}</td>
          <td><b>${esc(s.name)}</b></td>
          <td>${esc(s.course)}</td>
          <td>${esc(s.year)}</td>
          <td>${esc(s.section)}</td>
          <td>${s.status === "Active" ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-slate">Inactive</span>'}</td>
          <td>${studentAttendancePct(s.uid)}%</td>
          ${
            canEdit
              ? `<td><div class="row-actions">
            <button class="btn btn-sm" data-edit-student="${esc(s.uid)}">Edit</button>
            <button class="btn btn-sm" data-toggle-student="${esc(s.uid)}">${s.status === "Active" ? "Deactivate" : "Activate"}</button>
            <button class="btn btn-sm btn-danger" data-del-student="${esc(s.uid)}">Delete</button>
          </div></td>`
              : ""
          }
        </tr>`,
              )
              .join("")
          : `<tr><td colspan="${canEdit ? 9 : 8}"><div class="empty">No students match your filters.</div></td></tr>`
      }
      </tbody>
    </table>
    </div>
    <div class="pagination-bar" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px solid var(--line);flex-wrap:wrap;gap:10px;">
      <div style="font-size:12.5px;color:var(--slate);">
        Showing <b>${totalItems ? startIndex + 1 : 0}</b> to <b>${Math.min(startIndex + perPage, totalItems)}</b> of <b>${totalItems}</b> students
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-sm" id="stuPrevPage" ${state.stuPage <= 1 ? "disabled" : ""}>← Previous</button>
        <span style="font-size:12.5px;font-weight:600;padding:0 8px;">Page ${state.stuPage} of ${totalPages}</span>
        <button class="btn btn-sm" id="stuNextPage" ${state.stuPage >= totalPages ? "disabled" : ""}>Next →</button>
      </div>
    </div>
  </div>
  `;
}

/* ============================= EVENTS ============================= */
function renderEvents() {
  const canEdit = state.role === "admin";
  const list = [...state.events].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const d = (ds) => new Date(ds);
  return `
  <div class="panel-head no-print" style="margin-bottom:14px;">
    <h3 style="font-size:16px;">${canEdit ? "Manage Events" : "Events"}</h3>
    ${canEdit ? `<button class="btn btn-brass btn-sm" id="addEventBtn">+ Create Event</button>` : ""}
  </div>
  ${
    list.length
      ? list
          .map((e) => {
            const att = attendanceForEvent(e.id).length;
            return `
    <div class="event-card">
      <div class="event-date-block">
        <div class="mon">${d(e.date).toLocaleDateString("en-US", { month: "short" })}</div>
        <div class="day">${d(e.date).getDate()}</div>
      </div>
      <div class="event-perf"></div>
      <div class="event-main">
        <div class="name">${esc(e.name)}</div>
        <div class="meta">${e.time} · ${esc(e.venue)}</div>
        <div class="meta">${esc(e.description)}</div>
        <div class="meta" style="margin-top:5px;">${att} attendee${att === 1 ? "" : "s"} recorded</div>
      </div>
      <div class="event-side">
        <span class="pill ${e.status === "Open" ? "pill-green" : "pill-slate"}">${e.status}</span>
        ${
          canEdit
            ? `
          <div class="row-actions">
            <button class="btn btn-sm" data-toggle-event="${e.id}">${e.status === "Open" ? "Close" : "Reopen"}</button>
            <button class="btn btn-sm" data-edit-event="${e.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-del-event="${e.id}">Delete</button>
          </div>`
            : ""
        }
      </div>
    </div>`;
          })
          .join("")
      : '<div class="empty">No events created yet.</div>'
  }
  `;
}

/* ============================= SCANNER ============================= */
let lastScannedUid = null;
let lastScannedTime = 0;

function renderScanner() {
  const openEvents = state.events.filter((e) => e.status === "Open");
  if (!state.scannerEventId || !eventById(state.scannerEventId))
    state.scannerEventId = openEvents[0]?.id || null;
  const res = state.lastScan;
  let resClass = "idle",
    resHtml =
      '<div style="font-size:34px;">📷</div><div class="s-meta">Scan a QR code or enter a UID to begin.</div>';
  if (res) {
    if (res.status === "present") {
      resClass = "present";
      resHtml = `<div class="big-status" style="color:var(--forest)">✓ PRESENT</div><div class="s-name">${esc(res.student.name)}</div><div class="s-meta">${esc(res.student.course)} · ${esc(res.student.year)}</div><div class="s-meta mono">${esc(res.student.uid)}</div>`;
    } else if (res.status === "dup") {
      resClass = "dup";
      resHtml = `<div class="big-status" style="color:var(--amber)">ALREADY SCANNED</div><div class="s-name">${esc(res.student.name)}</div><div class="s-meta">Recorded previously</div>`;
    } else {
      resClass = "invalid";
      resHtml = `<div class="big-status" style="color:var(--rust)">✕ INVALID QR CODE</div><div class="s-meta">"${esc(res.raw)}" does not match any student UID.</div>`;
    }
  }
  return `
  <div class="panel no-print">
    <div class="panel-head">
      <h3>Scanning Session</h3>
      <div class="hint">Scanning as ${esc(state.officerName || "—")}</div>
    </div>
    <div class="toolbar">
      <select class="select" id="scannerEventSelect" ${!openEvents.length ? "disabled" : ""}>
        ${openEvents.length ? openEvents.map((e) => `<option value="${e.id}" ${e.id === state.scannerEventId ? "selected" : ""}>${esc(e.name)} — ${fmtDate(e.date)}</option>`).join("") : "<option>No open events</option>"}
      </select>
      <button class="btn ${state.scannerActive ? "btn-danger" : "btn-dark"} btn-sm" id="toggleCameraBtn" ${!openEvents.length ? "disabled" : ""}>${state.scannerActive ? "Stop Camera" : "Start Camera"}</button>
    </div>
  </div>
  <div class="scan-layout">
    <div class="panel">
      <h3 style="margin-bottom:12px;font-size:14px;">Camera</h3>
      <div id="qr-reader"></div>
      <form id="manualScanForm" style="display:flex;gap:8px;margin-top:12px;">
        <input class="input mono" id="manualUidInput" placeholder="Or type / paste Student UID" style="flex:1;" ${!openEvents.length ? "disabled" : ""}>
        <button class="btn btn-brass" ${!openEvents.length ? "disabled" : ""}>Scan</button>
      </form>
    </div>
    <div>
      <div class="scan-result ${resClass}">${resHtml}</div>
      <div class="panel" style="margin-top:14px;">
        <h3 style="font-size:14px;margin-bottom:8px;">Recent Scans This Session</h3>
        <div id="recentScansContainer">
          ${renderRecentScansRows()}
        </div>
      </div>
    </div>
  </div>
  `;
}

function renderRecentScansRows() {
  return state.recentScans.length
    ? state.recentScans
        .slice(0, 6)
        .map(
          (r) => `
    <div class="recent-scan-row">
      <div>${esc(r.name)}</div>
      <div class="pill ${r.status === "present" ? "pill-green" : r.status === "dup" ? "pill-amber" : r.status === "offline_queued" ? "pill-blue" : "pill-rust"}">${r.status === "present" ? "Present" : r.status === "dup" ? "Duplicate" : r.status === "offline_queued" ? "Saved Offline" : "Invalid"}</div>
    </div>`,
        )
        .join("")
    : '<div class="empty">No scans yet this session.</div>';
}

function updateScanUI() {
  const scanResultEl = document.querySelector(".scan-result");
  if (scanResultEl && state.lastScan) {
    const res = state.lastScan;
    let resClass = "idle",
      resHtml = "";
    if (res.status === "present") {
      resClass = "present";
      resHtml = `<div class="big-status" style="color:var(--forest)">✓ PRESENT</div><div class="s-name">${esc(res.student.name)}</div><div class="s-meta">${esc(res.student.course || '')} · ${esc(res.student.year || '')}</div><div class="s-meta mono">${esc(res.student.uid || '')}</div>`;
    } else if (res.status === "dup") {
      resClass = "dup";
      resHtml = `<div class="big-status" style="color:var(--amber)">ALREADY SCANNED</div><div class="s-name">${esc(res.student.name)}</div><div class="s-meta">Recorded previously</div>`;
    } else if (res.status === "offline_queued") {
      resClass = "dup";
      resHtml = `<div class="big-status" style="color:#0284c7">⚡ SAVED OFFLINE</div><div class="s-name">${esc(res.student.name)}</div><div class="s-meta">Stored in device · Will sync when online</div><div class="s-meta mono">${esc(res.student.uid || '')}</div>`;
    } else {
      resClass = "invalid";
      resHtml = `<div class="big-status" style="color:var(--rust)">✕ INVALID QR CODE</div><div class="s-meta">"${esc(res.raw)}" does not match any student UID.</div>`;
    }

    scanResultEl.className = "scan-result " + resClass;
    scanResultEl.innerHTML = resHtml;
  }

  const container = document.getElementById("recentScansContainer");
  if (container) {
    container.innerHTML = renderRecentScansRows();
  }
}

async function handleScan(rawUid) {
  const uid = (rawUid || "").trim();
  if (!uid) return;

  const now = Date.now();
  // Ignore duplicate scan triggers for the same QR code within 3 seconds
  if (uid === lastScannedUid && now - lastScannedTime < 3000) {
    return;
  }
  lastScannedUid = uid;
  lastScannedTime = now;

  const evId = state.scannerEventId;
  if (!evId) {
    toast("Select an open event first", "err");
    return;
  }

  let data = null;
  let res = null;
  let isOfflineMode = !navigator.onLine;

  if (!isOfflineMode) {
    try {
      res = await fetch("/api/scan/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_uid: uid,
          event_id: parseInt(evId),
          officer: state.officerName || "Officer J. Reyes",
        }),
      });
      data = await res.json();
    } catch (e) {
      console.warn("Scan API fetch error, switching to offline queue:", e);
      isOfflineMode = true;
    }
  }

  const s = studentByUid(uid) || { name: uid, uid: uid, course: "ACS Member", year: "Student" };

  if (isOfflineMode) {
    const payload = {
      student_uid: uid,
      event_id: parseInt(evId),
      officer: state.officerName || "Officer J. Reyes",
    };
    if (window.OfflineDB) {
      await window.OfflineDB.savePendingScan(payload);
    }
    state.attendance.push({
      id: "offline_" + Date.now(),
      studentUid: uid,
      eventId: parseInt(evId),
      timestamp: new Date().toISOString(),
      officer: payload.officer,
      isOffline: true
    });
    state.lastScan = { status: "offline_queued", student: s };
    state.recentScans.unshift({
      name: s.name + " (Saved Offline)",
      status: "offline_queued",
    });
    beep("ok");
    toast("Network offline — scan saved locally!", "ok");
    updateSyncBadge();
  } else if (res && res.status === 201) {
    state.attendance.push({
      id: data.attendance_id,
      studentUid: uid,
      eventId: parseInt(evId),
      timestamp: data.timestamp,
      officer: data.officer,
    });
    state.lastScan = { status: "present", student: s };
    state.recentScans.unshift({
      name: data.student_name || s.name,
      status: "present",
    });
    beep("ok");
  } else if (res && res.status === 409) {
    state.lastScan = { status: "dup", student: s };
    state.recentScans.unshift({ name: s.name, status: "dup" });
    beep("dup");
  } else {
    state.lastScan = { status: "invalid", raw: uid };
    state.recentScans.unshift({ name: uid || "(empty)", status: "invalid" });
    beep("bad");
  }

  updateScanUI();
}

function startScanner() {
  if (html5QrInstance || typeof Html5Qrcode === "undefined") return;
  const qrRegion = document.getElementById("qr-reader");
  if (!qrRegion) return;

  html5QrInstance = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: { width: 220, height: 220 } };
  const onScanSuccess = (decodedText) => handleScan(decodedText);
  const onScanError = () => {};

  Html5Qrcode.getCameras()
    .then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;
        html5QrInstance
          .start(cameraId, config, onScanSuccess, onScanError)
          .then(() => {
            state.scannerActive = true;
          })
          .catch(() => startWithFacingMode());
      } else {
        startWithFacingMode();
      }
    })
    .catch(() => startWithFacingMode());

  function startWithFacingMode() {
    html5QrInstance
      .start({ facingMode: "user" }, config, onScanSuccess, onScanError)
      .then(() => {
        state.scannerActive = true;
      })
      .catch(() => {
        html5QrInstance
          .start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError,
          )
          .then(() => {
            state.scannerActive = true;
          })
          .catch(() => {
            toast("Camera unavailable — use manual UID entry", "err");
            html5QrInstance = null;
            state.scannerActive = false;
          });
      });
  }
}
function stopScanner() {
  if (html5QrInstance) {
    html5QrInstance
      .stop()
      .then(() => html5QrInstance.clear())
      .catch(() => {});
    html5QrInstance = null;
  }
  state.scannerActive = false;
}

/* ============================= STATISTICS ============================= */
function renderStatistics() {
  state.statFilters = state.statFilters || {
    event: "",
    year: "",
    from: "",
    to: "",
  };
  const f = state.statFilters;
  let att = state.attendance.slice();
  if (f.event) att = att.filter((a) => a.eventId === f.event);
  if (f.from) att = att.filter((a) => a.timestamp.slice(0, 10) >= f.from);
  if (f.to) att = att.filter((a) => a.timestamp.slice(0, 10) <= f.to);
  let studentsScope = activeStudents();
  if (f.year) studentsScope = studentsScope.filter((s) => s.year === f.year);

  const byEventPct = state.events.map((e) => {
    const p = attendanceForEvent(e.id).length;
    const total = activeStudents().length || 1;
    return { label: e.name, value: Math.round((p / total) * 100) };
  });
  const officerLogs = {};
  att.forEach((a) => {
    officerLogs[a.officer] = (officerLogs[a.officer] || 0) + 1;
  });

  return `
  <div class="panel no-print">
    <div class="panel-head"><h3>Filters</h3>
      <div>
        <button class="btn btn-sm" id="printReportBtn">Print / Save PDF</button>
        <button class="btn btn-sm btn-brass" id="exportStatsBtn">Export CSV</button>
      </div>
    </div>
    <div class="toolbar">
      <select class="select" id="statEventFilter"><option value="">All Events</option>${state.events.map((e) => `<option value="${e.id}" ${f.event === e.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>
      <select class="select" id="statYearFilter"><option value="">All Years</option>${YEARS.map((y) => `<option ${f.year === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      <input type="date" class="input" id="statFrom" value="${f.from}" style="min-width:0">
      <input type="date" class="input" id="statTo" value="${f.to}" style="min-width:0">
    </div>
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Attendance % per Event</h3></div>
    ${svgHBar(
      byEventPct.map((x) => ({ label: x.label, value: x.value })),
      true,
    )}
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Officer Attendance Logs</h3></div>
    ${
      Object.keys(officerLogs).length
        ? `<table><thead><tr><th>Officer</th><th>Scans Recorded</th></tr></thead><tbody>
      ${Object.entries(officerLogs)
        .map(([o, n]) => `<tr><td>${esc(o)}</td><td>${n}</td></tr>`)
        .join("")}
    </tbody></table>`
        : '<div class="empty">No scan activity in this filter range.</div>'
    }
  </div>

  <div class="panel">
    <div class="panel-head"><h3>Attendance % per Student</h3></div>
    <div class="table-wrap"><table><thead><tr><th>UID</th><th>Name</th><th>Year</th><th>Attendance %</th></tr></thead><tbody>
      ${studentsScope.map((s) => `<tr><td><span class="uid-chip">${esc(s.uid)}</span></td><td>${esc(s.name)}</td><td>${esc(s.year)}</td><td>${studentAttendancePct(s.uid)}%</td></tr>`).join("")}
    </tbody></table></div>
  </div>
  `;
}

/* ============================= SETTINGS / SEMESTER ============================= */
function renderSettings() {
  const s = state.settings;
  const nextIsPromotion = s.semester === "Second Semester";
  return `
  <div class="panel">
    <div class="panel-head"><h3>Current Term</h3></div>
    <div class="stat-grid" style="grid-template-columns:repeat(2,minmax(160px,1fr));">
      ${statCard("Semester", esc(s.semester), "")}
      ${statCard("Academic Year", esc(s.academicYear), "")}
    </div>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Start New Semester</h3></div>
    <p style="font-size:13px;color:var(--slate);line-height:1.6;max-width:560px;">
      ${
        nextIsPromotion
          ? "This will roll over to <b>First Semester</b> of the next academic year and automatically promote every active student one year level. 4th Year students will be marked as Alumni. All historical attendance records are preserved."
          : "This will move the term forward to <b>Second Semester</b> of the current academic year. No student year levels will change."
      }
    </p>
    <button class="btn btn-brass" id="startSemesterBtn">Start New Semester →</button>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Officer Roster</h3></div>
    <div class="toolbar">
      <input class="input" id="newOfficerInput" placeholder="New officer name">
      <button class="btn btn-sm" id="addOfficerBtn">+ Add Officer</button>
    </div>
    <table><tbody>
      ${state.officers.map((o) => `<tr><td>${esc(o)}</td><td style="text-align:right;"><button class="btn btn-sm btn-danger" data-del-officer="${esc(o)}">Remove</button></td></tr>`).join("")}
    </tbody></table>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Admin Credentials & Security</h3></div>
    <p style="font-size:13px;color:var(--slate);line-height:1.5;margin-bottom:12px;">Customize your Super User login username and password below:</p>
    <div class="field-row" style="max-width:540px;">
      <div class="field"><label>Admin Username</label><input class="input" id="adminUserInp" value="${esc(s.adminUsername || 'admin')}"></div>
      <div class="field"><label>New Admin Password</label><input type="password" class="input" id="adminPassInp" placeholder="Enter new password"></div>
    </div>
    <button class="btn btn-brass" id="saveAdminCredsBtn">Save Credentials</button>
  </div>
  `;
}

/* ============================= STUDENT ROLE VIEWS ============================= */
function renderMyQr() {
  const s = studentByUid(state.studentViewUid);
  if (!s) return '<div class="empty">No student selected.</div>';
  return `<div class="panel" style="max-width:340px;">
    <div class="panel-head"><h3>My Badge</h3></div>
    <div id="myQrBadge"></div>
    <div class="badge-actions no-print" style="padding:14px 0 0;"><button class="btn btn-sm" id="printMyQrBtn">Print</button></div>
  </div>`;
}
function renderMyAttendance() {
  const s = studentByUid(state.studentViewUid);
  if (!s) return '<div class="empty">No student selected.</div>';
  const rows = attendanceForStudent(s.uid).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
  return `
  <div class="stat-grid">
    ${statCard("Attendance Rate", studentAttendancePct(s.uid) + "%", "")}
    ${statCard("Events Attended", rows.length, state.events.length + " total events")}
  </div>
  <div class="panel">
    <div class="panel-head"><h3>History</h3></div>
    ${
      rows.length
        ? `<table><thead><tr><th>Event</th><th>Date</th><th>Time</th><th>Officer</th></tr></thead><tbody>
      ${rows
        .map((a) => {
          const e = eventById(a.eventId);
          return `<tr><td>${esc(e?.name || "")}</td><td>${fmtDate(a.timestamp)}</td><td>${fmtTime(a.timestamp)}</td><td>${esc(a.officer)}</td></tr>`;
        })
        .join("")}
    </tbody></table>`
        : '<div class="empty">No attendance recorded yet.</div>'
    }
  </div>
  `;
}

/* ============================= EDIT MODALS ============================= */
function openModal(html) {
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.id = "modalOverlay";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  wrap.onclick = (e) => {
    if (e.target === wrap) closeModal();
  };
  document.body.appendChild(wrap);
}
function closeModal() {
  document.getElementById("modalOverlay")?.remove();
}

function studentModal(uid) {
  const isEdit = !!uid;
  const s = isEdit
    ? studentByUid(uid)
    : {
        studentNumber: "",
        name: "",
        course: COURSES[0],
        year: YEARS[0],
        section: SECTIONS[0],
        status: "Active",
      };
  openModal(`
    <h3>${isEdit ? "Edit Student" : "Add Student"}</h3>
    <div class="field"><label>Full Name</label><input id="f_name" value="${esc(s.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Student Number</label><input id="f_num" value="${esc(s.studentNumber)}"></div>
      <div class="field"><label>Status</label><select id="f_status"><option ${s.status === "Active" ? "selected" : ""}>Active</option><option ${s.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div>
    </div>
    <div class="field"><label>Course</label><select id="f_course">${COURSES.map((c) => `<option ${s.course === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
    <div class="field-row">
      <div class="field"><label>Year Level</label><select id="f_year">${YEARS.map((y) => `<option ${s.year === y ? "selected" : ""}>${y}</option>`).join("")}</select></div>
      <div class="field"><label>Section</label><select id="f_section">${SECTIONS.map((x) => `<option ${s.section === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    </div>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-brass" id="saveStudent">${isEdit ? "Save Changes" : "Add Student"}</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveStudent").onclick = async () => {
    const name = document.getElementById("f_name").value.trim();
    if (!name) {
      toast("Name is required", "err");
      return;
    }
    const payload = {
      student_number: document.getElementById("f_num").value.trim() || "N/A",
      name,
      course: document.getElementById("f_course").value,
      year: document.getElementById("f_year").value,
      section: document.getElementById("f_section").value,
      status: document.getElementById("f_status").value,
    };
    if (isEdit) {
      const res = await fetch(`/api/students/${s.uid}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Student updated", "ok");
    } else {
      payload.uid = newUid();
      const res = await fetch("/api/students/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Student added", "ok");
    }
    closeModal();
    await loadData();
  };
}
function eventModal(id) {
  const isEdit = !!id;
  const e = isEdit
    ? eventById(id)
    : {
        name: "",
        date: new Date().toISOString().slice(0, 10),
        time: "09:00",
        venue: "",
        description: "",
        status: "Open",
      };
  openModal(`
    <h3>${isEdit ? "Edit Event" : "Create Event"}</h3>
    <div class="field"><label>Event Name</label><input id="e_name" value="${esc(e.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Date</label><input type="date" id="e_date" value="${e.date}"></div>
      <div class="field"><label>Time</label><input type="time" id="e_time" value="${e.time}"></div>
    </div>
    <div class="field"><label>Venue</label><input id="e_venue" value="${esc(e.venue)}"></div>
    <div class="field"><label>Description</label><textarea id="e_desc" rows="3">${esc(e.description)}</textarea></div>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-brass" id="saveEvent">${isEdit ? "Save Changes" : "Create Event"}</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveEvent").onclick = async () => {
    const name = document.getElementById("e_name").value.trim();
    if (!name) {
      toast("Event name is required", "err");
      return;
    }
    const payload = {
      name,
      date: document.getElementById("e_date").value,
      time: document.getElementById("e_time").value,
      venue: document.getElementById("e_venue").value.trim(),
      description: document.getElementById("e_desc").value.trim(),
      status: isEdit ? e.status : "Open",
    };
    if (isEdit) {
      const res = await fetch(`/api/events/${e.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Event updated", "ok");
    } else {
      const res = await fetch("/api/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Event created", "ok");
    }
    closeModal();
    await loadData();
  };
}
function confirmModal(title, msg, onYes) {
  openModal(`
    <h3>${esc(title)}</h3>
    <p style="font-size:13.5px;color:var(--slate);line-height:1.6;">${msg}</p>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-danger" id="confirmYes">Confirm</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("confirmYes").onclick = () => {
    onYes();
    closeModal();
  };
}

/* ============================= SEMESTER LOGIC ============================= */
function startNewSemester() {
  const s = state.settings;
  if (s.semester === "First Semester") {
    confirmModal(
      "Move to Second Semester?",
      "This only updates the current semester. Student year levels stay the same.",
      () => {
        s.semester = "Second Semester";
        persist();
        toast("Now in Second Semester", "ok");
        renderPage();
      },
    );
  } else {
    confirmModal(
      "Promote students & start next Academic Year?",
      "Every active student advances one year level (4th Year → Alumni / Archived). Attendance history is kept for all students.",
      () => {
        state.students.forEach((st) => {
          if (st.status !== "Active") return;
          const idx = YEARS.indexOf(st.year);
          if (idx === YEARS.length - 1) {
            st.status = "Inactive";
            st.year = "Alumni";
          } else st.year = YEARS[idx + 1];
        });
        const [y1, y2] = s.academicYear.split("-").map(Number);
        s.academicYear = y1 + 1 + "-" + (y2 + 1);
        s.semester = "First Semester";
        persist();
        toast("New academic year started — students promoted", "ok");
        renderPage();
      },
    );
  }
}

/* ============================= CSV IMPORT ============================= */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] || ""));
    return row;
  });
}

/* ============================= POST-RENDER WIRING ============================= */
function afterRender(page) {
  if (page !== "scanner") stopScanner();

  if (page === "dashboard") {
    document.getElementById("dashEventSelect").onchange = (e) => {
      state.dashEventId = e.target.value;
      renderPage();
    };
  }

  if (page === "qr-generator") {
    const single = document.getElementById("qrSingle");
    const s = studentByUid(state.qrUid);
    if (s) {
      single.innerHTML = badgeCard(s, "single-qrimg-");
      renderQrInto(s, "single-qrimg-" + s.uid.replace(/[^a-zA-Z0-9]/g, ""));
    }
    document.getElementById("qrSearch").oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const found = activeStudents().find(
        (st) =>
          st.name.toLowerCase().includes(q) || st.uid.toLowerCase().includes(q),
      );
      if (found) {
        state.qrUid = found.uid;
        renderPage();
      }
    };
    const bulk = document.getElementById("bulkBadges");
    bulk.innerHTML = activeStudents()
      .map((st) => badgeCard(st, "bulk-qrimg-"))
      .join("");
    activeStudents().forEach((st) =>
      renderQrInto(st, "bulk-qrimg-" + st.uid.replace(/[^a-zA-Z0-9]/g, "")),
    );
    document.querySelectorAll("[data-dl]").forEach((btn) => {
      btn.onclick = () => {
        const canvas = document
          .getElementById(btn.dataset.dl)
          ?.querySelector("canvas");
        if (canvas) {
          const a = document.createElement("a");
          a.download = btn.dataset.uid + ".png";
          a.href = canvas.toDataURL();
          a.click();
        }
      };
    });
    document.getElementById("printAllBtn").onclick = () => window.print();
  }

  if (page === "students") {
    document.getElementById("stuSearchInput").oninput = (e) => {
      state.stuSearch = e.target.value;
      state.stuPage = 1;
      renderPage();
    };
    document.getElementById("stuYearFilter").onchange = (e) => {
      state.stuYearFilter = e.target.value;
      state.stuPage = 1;
      renderPage();
    };
    document.getElementById("stuStatusFilter").onchange = (e) => {
      state.stuStatusFilter = e.target.value;
      state.stuPage = 1;
      renderPage();
    };
    const prevBtn = document.getElementById("stuPrevPage");
    if (prevBtn)
      prevBtn.onclick = () => {
        if (state.stuPage > 1) {
          state.stuPage--;
          renderPage();
        }
      };
    const nextBtn = document.getElementById("stuNextPage");
    if (nextBtn)
      nextBtn.onclick = () => {
        state.stuPage++;
        renderPage();
      };
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.onclick = () => {
        const k = th.dataset.sort;
        state.stuSort = {
          key: k,
          dir: state.stuSort.key === k ? -state.stuSort.dir : 1,
        };
        renderPage();
      };
    });
    const addStudentBtn = document.getElementById("addStudentBtn");
    if (addStudentBtn) addStudentBtn.onclick = () => studentModal(null);
    document
      .querySelectorAll("[data-edit-student]")
      .forEach((b) => (b.onclick = () => studentModal(b.dataset.editStudent)));
    document.querySelectorAll("[data-toggle-student]").forEach(
      (b) =>
        (b.onclick = () => {
          const s = studentByUid(b.dataset.toggleStudent);
          if (!s) return;
          const isDeactivating = s.status === "Active";
          const doToggle = async () => {
            const newStatus = isDeactivating ? "Inactive" : "Active";
            await fetch(`/api/students/${s.uid}/`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            });
            toast(`Student ${s.name} ${isDeactivating ? "deactivated" : "activated"}`, "ok");
            await loadData();
          };

          if (isDeactivating) {
            confirmModal(
              "Deactivate Student Account?",
              `Are you sure you want to deactivate <b>${esc(s.name)}</b> (${esc(s.uid)})? Deactivated students will be marked inactive and excluded from active event rosters.`,
              doToggle,
            );
          } else {
            doToggle();
          }
        }),
    );
    document.querySelectorAll("[data-del-student]").forEach(
      (b) =>
        (b.onclick = () => {
          const s = studentByUid(b.dataset.delStudent);
          const studentName = s ? s.name : b.dataset.delStudent;
          confirmModal(
            "Delete Student Record Permanently?",
            `Are you sure you want to permanently delete <b>${esc(studentName)}</b> (${esc(b.dataset.delStudent)})?<br><br><span style="color:var(--rust);font-weight:600;">Warning:</span> This action cannot be undone. The student profile, QR badge allocation, and all associated attendance log history will be permanently deleted from the database.`,
            async () => {
              await fetch(`/api/students/${b.dataset.delStudent}/`, {
                method: "DELETE",
              });
              toast(`Student ${studentName} deleted`, "ok");
              await loadData();
            },
          );
        }),
    );
    document.getElementById("exportStudentsBtn").onclick = () => {
      const csv = toCSV(state.students, [
        "uid",
        "studentNumber",
        "name",
        "course",
        "year",
        "section",
        "status",
      ]);
      downloadFile("students.csv", csv, "text/csv");
    };
    const importCsv = document.getElementById("importCsv");
    if (importCsv)
      importCsv.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const rows = parseCSV(reader.result);
            let count = 0;
            for (const r of rows) {
              if (!r.name) continue;
              await fetch("/api/students/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  uid: newUid(),
                  student_number: r.studentNumber || r.studentnumber || "N/A",
                  name: r.name,
                  course: r.course || COURSES[0],
                  year: r.year || YEARS[0],
                  section: r.section || "A",
                  status: "Active",
                }),
              });
              count++;
            }
            toast(count + " students imported", "ok");
            await loadData();
          } catch (err) {
            toast("Could not parse CSV file", "err");
          }
        };
        reader.readAsText(file);
      };
  }

  if (page === "events") {
    const addBtn = document.getElementById("addEventBtn");
    if (addBtn) addBtn.onclick = () => eventModal(null);
    document
      .querySelectorAll("[data-edit-event]")
      .forEach((b) => (b.onclick = () => eventModal(b.dataset.editEvent)));
    document.querySelectorAll("[data-toggle-event]").forEach(
      (b) =>
        (b.onclick = async () => {
          const e = eventById(parseInt(b.dataset.toggleEvent));
          if (!e) return;
          const newStatus = e.status === "Open" ? "Closed" : "Open";
          await fetch(`/api/events/${e.id}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          await loadData();
        }),
    );
    document.querySelectorAll("[data-del-event]").forEach(
      (b) =>
        (b.onclick = () => {
          const evId = parseInt(b.dataset.delEvent);
          const ev = eventById(evId);
          const eventName = ev ? ev.name : `Event #${evId}`;
          confirmModal(
            "Delete Event Permanently?",
            `Are you sure you want to permanently delete <b>${esc(eventName)}</b>?<br><br><span style="color:var(--rust);font-weight:600;">Warning:</span> This action cannot be undone. The event entry and all student attendance scan logs recorded for this event will be permanently removed from system statistics and reports.`,
            async () => {
              await fetch(`/api/events/${evId}/`, {
                method: "DELETE",
              });
              toast(`Event ${eventName} deleted`, "ok");
              await loadData();
            },
          );
        }),
    );
  }

  if (page === "scanner") {
    const sel = document.getElementById("scannerEventSelect");
    if (sel)
      sel.onchange = (e) => {
        state.scannerEventId = e.target.value;
      };
    const camBtn = document.getElementById("toggleCameraBtn");
    if (camBtn)
      camBtn.onclick = () => {
        state.scannerActive ? stopScanner() : startScanner();
        renderPage();
      };
    const form = document.getElementById("manualScanForm");
    if (form)
      form.onsubmit = (e) => {
        e.preventDefault();
        const inp = document.getElementById("manualUidInput");
        handleScan(inp.value);
        inp.value = "";
        inp.focus();
      };
    if (state.scannerActive) startScanner();
  }

  if (page === "statistics") {
    document.getElementById("statEventFilter").onchange = (e) => {
      state.statFilters.event = e.target.value;
      renderPage();
    };
    document.getElementById("statYearFilter").onchange = (e) => {
      state.statFilters.year = e.target.value;
      renderPage();
    };
    document.getElementById("statFrom").onchange = (e) => {
      state.statFilters.from = e.target.value;
      renderPage();
    };
    document.getElementById("statTo").onchange = (e) => {
      state.statFilters.to = e.target.value;
      renderPage();
    };
    document.getElementById("printReportBtn").onclick = () => window.print();
    document.getElementById("exportStatsBtn").onclick = () => {
      const csv = toCSV(
        state.attendance.map((a) => ({
          ...a,
          studentName: studentByUid(a.studentUid)?.name,
          eventName: eventById(a.eventId)?.name,
        })),
        [
          "id",
          "studentUid",
          "studentName",
          "eventId",
          "eventName",
          "timestamp",
          "officer",
        ],
      );
      downloadFile("attendance-report.csv", csv, "text/csv");
    };
  }

  if (page === "settings") {
    document.getElementById("startSemesterBtn").onclick = startNewSemester;
    document.getElementById("addOfficerBtn").onclick = () => {
      const inp = document.getElementById("newOfficerInput");
      const v = inp.value.trim();
      if (v) {
        state.officers.push(v);
        persist();
        renderPage();
      }
    };
    document.querySelectorAll("[data-del-officer]").forEach(
      (b) =>
        (b.onclick = () => {
          state.officers = state.officers.filter(
            (o) => o !== b.dataset.delOfficer,
          );
          persist();
          renderPage();
        }),
    );
    const saveAdminBtn = document.getElementById("saveAdminCredsBtn");
    if (saveAdminBtn) {
      saveAdminBtn.onclick = async () => {
        const u = document.getElementById("adminUserInp").value.trim();
        const p = document.getElementById("adminPassInp").value.trim();
        if (!u) {
          toast("Admin username cannot be empty", "err");
          return;
        }
        const payload = { admin_username: u };
        if (p) payload.admin_password = p;
        const res = await fetch("/api/settings/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast("Admin credentials updated successfully", "ok");
          await loadData();
        } else {
          toast("Failed to update credentials", "err");
        }
      };
    }
  }

  if (page === "my-qr") {
    const s = studentByUid(state.studentViewUid);
    if (s) {
      document.getElementById("myQrBadge").innerHTML = badgeCard(
        s,
        "my-qrimg-",
      );
      renderQrInto(s, "my-qrimg-" + s.uid.replace(/[^a-zA-Z0-9]/g, ""));
    }
    const pb = document.getElementById("printMyQrBtn");
    if (pb) pb.onclick = () => window.print();
  }
}

function renderQrInto(student, elId) {
  const el = document.getElementById(elId);
  if (!el || typeof QRCode === "undefined") return;
  el.innerHTML = "";
  new QRCode(el, {
    text: student.uid,
    width: 80,
    height: 80,
    colorDark: "#151E33",
    colorLight: "#ffffff",
  });
}

/* ============================= INIT ============================= */
loadData();

/* ============================= PWA OFFLINE SYNC ============================= */
async function updateSyncBadge() {
  const container = document.getElementById("syncBadgeContainer");
  if (!container) return;

  let pendingCount = 0;
  if (window.OfflineDB) {
    pendingCount = await window.OfflineDB.getPendingCount();
  }

  const isOnline = navigator.onLine;
  const isSyncing = window.isSyncingScans;

  let statusText = isOnline ? "Online" : "Offline";
  let dotClass = isOnline ? "sync-dot" : "sync-dot offline";

  if (isSyncing) {
    statusText = "Syncing...";
    dotClass = "sync-dot syncing";
  } else if (pendingCount > 0) {
    statusText = `${pendingCount} pending`;
  }

  container.innerHTML = `
    <div class="sync-status-chip" title="${pendingCount} offline scans waiting to sync. Click to sync now." onclick="triggerManualSync()">
      <span class="${dotClass}"></span>
      <span>${statusText}</span>
    </div>
  `;
}

async function syncOfflineScans() {
  if (!navigator.onLine) return;
  if (window.isSyncingScans) return;
  if (!window.OfflineDB) return;

  const pending = await window.OfflineDB.getPendingScans();
  if (!pending || pending.length === 0) {
    updateSyncBadge();
    return;
  }

  window.isSyncingScans = true;
  updateSyncBadge();
  toast(`Syncing ${pending.length} offline scan(s)...`, "info");

  try {
    const res = await fetch("/api/sync/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scans: pending }),
    });

    if (res.ok) {
      const data = await res.json();
      const syncedIds = [];
      let successCount = 0;
      let dupCount = 0;

      (data.results || []).forEach((r) => {
        if (r.client_id) syncedIds.push(r.client_id);
        if (r.status === "success") successCount++;
        if (r.status === "duplicate") dupCount++;
      });

      await window.OfflineDB.removePendingScans(syncedIds);
      toast(`Sync complete! ${successCount} synced, ${dupCount} already recorded.`, "ok");
      loadData();
    } else {
      toast("Sync failed (server unavailable)", "err");
    }
  } catch (err) {
    console.warn("Offline sync error", err);
  } finally {
    window.isSyncingScans = false;
    updateSyncBadge();
  }
}

function triggerManualSync() {
  if (!navigator.onLine) {
    toast("Cannot sync while offline", "err");
    return;
  }
  syncOfflineScans();
}

window.addEventListener("online", () => {
  toast("Network reconnected! Syncing offline scans...", "ok");
  syncOfflineScans();
});

window.addEventListener("offline", () => {
  toast("Network disconnected — offline mode active", "err");
  updateSyncBadge();
});

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "TRIGGER_SYNC") {
      syncOfflineScans();
    }
  });
}
