/* ============================= QR GENERATOR ============================= */
function renderQrGenerator() {
  if (!state.qrUid || !studentByUid(state.qrUid))
    state.qrUid = activeStudents()[0]?.uid;

  state.qrPage = state.qrPage || 1;
  state.qrSearch = state.qrSearch || "";

  const q = state.qrSearch.toLowerCase().trim();
  const allActive = activeStudents();
  const filtered = q
    ? allActive.filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.uid.toLowerCase().includes(q) ||
          (st.studentNumber || "").toLowerCase().includes(q),
      )
    : allActive;

  const QR_PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / QR_PER_PAGE) || 1;
  if (state.qrPage > totalPages) state.qrPage = totalPages;
  if (state.qrPage < 1) state.qrPage = 1;

  const startIdx = (state.qrPage - 1) * QR_PER_PAGE;

  return `
  <div class="panel no-print">
    <div class="panel-head">
      <h3>Generate Student Badge</h3>
      <div class="hint">QR encodes the Student UID only, for security</div>
    </div>
    <div class="toolbar">
      <div class="search-wrap">${ICONS.search}<input class="input" id="qrSearch" placeholder="Search student by name, UID, or Student No…" value="${esc(state.qrSearch)}"></div>
    </div>
    <div id="qrSingle"></div>
  </div>
  <div class="panel">
    <div class="panel-head">
      <div>
        <h3>Bulk Badges (${filtered.length} Student${filtered.length === 1 ? "" : "s"})</h3>
        <div class="hint">Showing ${filtered.length ? startIdx + 1 : 0}–${Math.min(startIdx + QR_PER_PAGE, filtered.length)} of ${filtered.length} badges (10 per page)</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn btn-brass no-print" id="printAllBtn">Print Badges</button>
      </div>
    </div>

    <div class="badge-grid" id="bulkBadges"></div>

    ${
      totalPages > 1
        ? `
      <div class="pagination-bar no-print" style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding-top:14px;">
        <div style="font-size:12.5px;color:var(--slate);">Page <b>${state.qrPage}</b> of <b>${totalPages}</b></div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm" id="prevQrPage" ${state.qrPage <= 1 ? "disabled" : ""}>← Prev</button>
          <button class="btn btn-sm" id="nextQrPage" ${state.qrPage >= totalPages ? "disabled" : ""}>Next →</button>
        </div>
      </div>
    `
        : ""
    }
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

function downloadBadgePng(idPart, filename) {
  const container = document.getElementById(idPart);
  if (!container) return;

  const qrImg = container.querySelector("img");
  const qrCanvas = container.querySelector("canvas");
  const qrSource = qrImg || qrCanvas;
  if (!qrSource) {
    toast("Badge image loading, please click again", "err");
    return;
  }

  // Find student profile by matching UID
  const uidMatch = idPart.replace(/^single-qrimg-|^bulk-qrimg-/, "");
  const student = state.students.find(
    (s) => s.uid.replace(/[^a-zA-Z0-9]/g, "") === uidMatch
  ) || studentByUid(state.qrUid);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 500;
  canvas.height = 700;

  // Fallback for roundRect in older browsers
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h) {
      this.rect(x, y, w, h);
    };
  }

  // Main Card Outer Background
  ctx.fillStyle = "#151E33";
  ctx.beginPath();
  ctx.roundRect(0, 0, 500, 700, 20);
  ctx.fill();

  // Top Card Header Area
  ctx.fillStyle = "#0B1120";
  ctx.beginPath();
  ctx.roundRect(0, 0, 500, 220, [20, 20, 0, 0]);
  ctx.fill();

  // Header Org Brand
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("ATTENDQR · CAMPUS ID BADGE", 30, 45);

  // Student Full Name
  const name = student ? student.name : "Student Badge";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(name.length > 26 ? name.substring(0, 26) + "…" : name, 30, 95);

  // Course & Year Level
  const courseYear = student
    ? `${student.course} · ${student.year}`
    : "BS Computer Science";
  ctx.fillStyle = "#AEB6D2";
  ctx.font = "16px sans-serif";
  ctx.fillText(courseYear, 30, 135);

  // Divider Line
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 165);
  ctx.lineTo(470, 165);
  ctx.stroke();

  // Section & Status
  const sectionText = student
    ? `Section ${student.section} · ${student.status}`
    : "Active";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "14px sans-serif";
  ctx.fillText(sectionText, 30, 195);

  // White Background Box for QR Code
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(30, 250, 210, 210, 12);
  ctx.fill();

  // Draw QR Image into box
  try {
    ctx.drawImage(qrSource, 40, 260, 190, 190);
  } catch (e) {
    console.warn("QR canvas draw error", e);
  }

  // Information Panel alongside QR
  const infoX = 265;
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("SYSTEM UID", infoX, 280);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 17px monospace";
  ctx.fillText(student ? student.uid : "", infoX, 306);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("STUDENT NUMBER", infoX, 350);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "16px monospace";
  ctx.fillText(student ? student.studentNumber : "N/A", infoX, 376);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("SECTION", infoX, 420);

  ctx.fillStyle = "#AEB6D2";
  ctx.font = "14px sans-serif";
  ctx.fillText(student ? `Sec. ${student.section}` : "N/A", infoX, 444);

  // Footer Line
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(30, 620);
  ctx.lineTo(470, 620);
  ctx.stroke();

  // Footer Branding
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ASSOCIATION OF COMPUTER SCIENTISTS", 250, 655);
  ctx.textAlign = "left";

  // Trigger PNG File Download
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  const cleanName = (
    student ? `${student.name}_${student.studentNumber}` : filename || "QR_Badge"
  ).replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `${cleanName}_Badge.png`;
  a.href = dataUrl;
  a.click();
  toast("Full Badge PNG downloaded!", "ok");
}

function afterRenderQrGenerator() {
  const searchInp = document.getElementById("qrSearch");
  if (searchInp) {
    searchInp.oninput = (e) => {
      state.qrSearch = e.target.value;
      state.qrPage = 1;
      const q = state.qrSearch.toLowerCase().trim();
      const found = activeStudents().find(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.uid.toLowerCase().includes(q) ||
          (st.studentNumber || "").toLowerCase().includes(q),
      );
      if (found) state.qrUid = found.uid;
      updateQrResults();
    };
  }

  updateQrResults();

  const printBtn = document.getElementById("printAllBtn");
  if (printBtn) printBtn.onclick = () => window.print();
}

/* Incremental DOM update — updates single preview + bulk badges + pagination, keeps search input alive */
function updateQrResults() {
  // Update single preview
  const single = document.getElementById("qrSingle");
  const s = studentByUid(state.qrUid);
  if (single && s) {
    single.innerHTML = badgeCard(s, "single-qrimg-");
    renderQrInto(s, "single-qrimg-" + s.uid.replace(/[^a-zA-Z0-9]/g, ""));
  }

  // Compute filtered + paginated list
  const q = (state.qrSearch || "").toLowerCase().trim();
  const allActive = activeStudents();
  const filtered = q
    ? allActive.filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.uid.toLowerCase().includes(q) ||
          (st.studentNumber || "").toLowerCase().includes(q),
      )
    : allActive;

  const QR_PER_PAGE = 10;
  const totalPages = Math.ceil(filtered.length / QR_PER_PAGE) || 1;
  if (state.qrPage > totalPages) state.qrPage = totalPages;
  if (state.qrPage < 1) state.qrPage = 1;

  const startIdx = (state.qrPage - 1) * QR_PER_PAGE;
  const paged = filtered.slice(startIdx, startIdx + QR_PER_PAGE);

  // Update bulk badges
  const bulk = document.getElementById("bulkBadges");
  if (bulk) {
    if (!paged.length) {
      bulk.innerHTML = '<div class="empty">No active students match your search.</div>';
    } else {
      bulk.innerHTML = paged
        .map((st) => badgeCard(st, "bulk-qrimg-"))
        .join("");
      paged.forEach((st) =>
        renderQrInto(st, "bulk-qrimg-" + st.uid.replace(/[^a-zA-Z0-9]/g, "")),
      );
    }
  }

  // Wire pagination
  const prevBtn = document.getElementById("prevQrPage");
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (state.qrPage > 1) {
        state.qrPage--;
        updateQrResults();
      }
    };
  }
  const nextBtn = document.getElementById("nextQrPage");
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (state.qrPage < totalPages) {
        state.qrPage++;
        updateQrResults();
      }
    };
  }

  // Wire download buttons
  document.querySelectorAll("[data-dl]").forEach((btn) => {
    btn.onclick = () => {
      const s = studentByUid(btn.dataset.uid);
      const nameStr = s ? `${s.name}_${s.studentNumber}` : btn.dataset.uid;
      downloadBadgePng(btn.dataset.dl, nameStr);
    };
  });
}

