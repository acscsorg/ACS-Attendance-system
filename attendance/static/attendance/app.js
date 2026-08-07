/* ============================= ACS ATTENDANCE SYSTEM — ENTRY POINT ============================= */
/*
 * All application logic has been modularized into js/ subdirectory:
 *
 *   js/state.js          — Global state, constants, SVG icons
 *   js/helpers.js        — Utility functions (toast, formatters, CSV, beep, etc.)
 *   js/api.js            — Data loading, persistence, seeding, UID generation
 *   js/modals.js         — Modal system (student, event, confirm modals)
 *   js/auth.js           — Login portal, first-time password, offline auth
 *   js/layout.js         — Navigation, sidebar, render/renderPage shell, afterRender dispatcher
 *   js/sync.js           — PWA offline sync, network status badge
 *
 *   js/pages/dashboard.js     — Dashboard page + charts
 *   js/pages/qr-generator.js  — QR badge generation + download
 *   js/pages/students.js      — Student list CRUD
 *   js/pages/events.js        — Event management
 *   js/pages/scanner.js       — QR scanner + offline scan queue
 *   js/pages/device-log.js    — Device audit log
 *   js/pages/statistics.js    — Statistics & reports
 *   js/pages/settings.js      — Semester settings, officer CRUD, admin creds
 *   js/pages/student-views.js — Student role views (My QR, My Attendance)
 *
 * Load order is defined in index.html <script> tags.
 */

/* ============================= INIT ============================= */
loadData();
