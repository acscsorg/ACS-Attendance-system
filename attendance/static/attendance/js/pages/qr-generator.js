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
  const img = container.querySelector("img");
  const canvas = container.querySelector("canvas");
  let dataUrl = null;

  if (img && img.src) {
    dataUrl = img.src;
  } else if (canvas) {
    dataUrl = canvas.toDataURL("image/png");
  }

  if (dataUrl) {
    const a = document.createElement("a");
    a.download = (filename || "QR_Badge").replace(/[^a-zA-Z0-9_-]/g, "_") + ".png";
    a.href = dataUrl;
    a.click();
    toast("Badge PNG downloaded!", "ok");
  } else {
    toast("Badge image loading, please click again", "err");
  }
}

function afterRenderQrGenerator() {
  const single = document.getElementById("qrSingle");
  const s = studentByUid(state.qrUid);
  if (s) {
    single.innerHTML = badgeCard(s, "single-qrimg-");
    renderQrInto(s, "single-qrimg-" + s.uid.replace(/[^a-zA-Z0-9]/g, ""));
  }

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
      renderPage();
    };
  }

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

  const prevBtn = document.getElementById("prevQrPage");
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (state.qrPage > 1) {
        state.qrPage--;
        renderPage();
      }
    };
  }
  const nextBtn = document.getElementById("nextQrPage");
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (state.qrPage < totalPages) {
        state.qrPage++;
        renderPage();
      }
    };
  }

  document.querySelectorAll("[data-dl]").forEach((btn) => {
    btn.onclick = () => {
      const s = studentByUid(btn.dataset.uid);
      const nameStr = s ? `${s.name}_${s.studentNumber}` : btn.dataset.uid;
      downloadBadgePng(btn.dataset.dl, nameStr);
    };
  });

  const printBtn = document.getElementById("printAllBtn");
  if (printBtn) printBtn.onclick = () => window.print();
}
