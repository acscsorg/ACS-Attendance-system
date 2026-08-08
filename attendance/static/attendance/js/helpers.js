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

function isOffline() {
  return !navigator.onLine;
}
