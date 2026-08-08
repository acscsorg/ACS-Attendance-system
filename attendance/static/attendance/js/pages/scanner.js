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
        ${openEvents.length ? openEvents.map((e) => `<option value="${e.id}" ${String(e.id) === String(state.scannerEventId) ? "selected" : ""}>${esc(e.name)} — ${fmtDate(e.date)}</option>`).join("") : "<option>No open events</option>"}
      </select>
      <button class="btn ${state.scannerActive ? "btn-danger" : "btn-dark"} btn-sm" id="toggleCameraBtn" ${!openEvents.length ? "disabled" : ""}>${state.scannerActive ? "Stop Camera" : "Start Camera"}</button>
      <button class="btn btn-sm" id="switchCameraBtn" ${!openEvents.length ? "disabled" : ""}>📷 Switch (${state.cameraFacing === "environment" ? "Rear" : "Front"})</button>
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
  const evObj = eventById(parseInt(evId));
  const eventNameStr = evObj ? evObj.name : "Event #" + evId;
  const officerStr = state.officerName || (state.auth ? state.auth.name : "Officer");

  if (isOfflineMode) {
    const clientId = 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const payload = {
      client_id: clientId,
      student_uid: uid,
      event_id: parseInt(evId),
      officer: officerStr,
    };
    if (window.OfflineDB) {
      await window.OfflineDB.savePendingScan(payload);
      await window.OfflineDB.saveDeviceScanHistory({
        client_id: clientId,
        student_uid: uid,
        student_name: s.name,
        event_name: eventNameStr,
        event_id: parseInt(evId),
        officer: officerStr,
        timestamp: new Date().toISOString(),
        sync_status: "pending_offline"
      });
    }
    state.attendance.push({
      id: clientId,
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
    if (window.OfflineDB) {
      await window.OfflineDB.saveDeviceScanHistory({
        student_uid: uid,
        student_name: data.student_name || s.name,
        event_name: eventNameStr,
        event_id: parseInt(evId),
        officer: data.officer || officerStr,
        timestamp: data.timestamp || new Date().toISOString(),
        sync_status: "synced"
      });
    }
    beep("ok");
  } else if (res && res.status === 409) {
    state.lastScan = { status: "dup", student: s };
    state.recentScans.unshift({ name: s.name, status: "dup" });
    if (window.OfflineDB) {
      await window.OfflineDB.saveDeviceScanHistory({
        student_uid: uid,
        student_name: s.name,
        event_name: eventNameStr,
        event_id: parseInt(evId),
        officer: officerStr,
        timestamp: new Date().toISOString(),
        sync_status: "duplicate"
      });
    }
    beep("dup");
  } else {
    state.lastScan = { status: "invalid", raw: uid };
    state.recentScans.unshift({ name: uid || "(empty)", status: "invalid" });
    if (window.OfflineDB) {
      await window.OfflineDB.saveDeviceScanHistory({
        student_uid: uid,
        student_name: "Invalid QR (" + uid + ")",
        event_name: eventNameStr,
        event_id: parseInt(evId),
        officer: officerStr,
        timestamp: new Date().toISOString(),
        sync_status: "invalid"
      });
    }
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

  const primaryFacing = state.cameraFacing || "environment";
  const fallbackFacing = primaryFacing === "environment" ? "user" : "environment";

  html5QrInstance
    .start({ facingMode: primaryFacing }, config, onScanSuccess, onScanError)
    .then(() => {
      state.scannerActive = true;
    })
    .catch(() => {
      html5QrInstance
        .start({ facingMode: fallbackFacing }, config, onScanSuccess, onScanError)
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

function afterRenderScanner() {
  const sel = document.getElementById("scannerEventSelect");
  if (sel)
    sel.onchange = (e) => {
      state.scannerEventId = parseInt(e.target.value) || e.target.value;
    };
  const camBtn = document.getElementById("toggleCameraBtn");
  if (camBtn)
    camBtn.onclick = () => {
      state.scannerActive ? stopScanner() : startScanner();
      renderPage();
    };
  const switchBtn = document.getElementById("switchCameraBtn");
  if (switchBtn) {
    switchBtn.onclick = () => {
      state.cameraFacing = state.cameraFacing === "environment" ? "user" : "environment";
      if (state.scannerActive) {
        stopScanner();
        startScanner();
      }
      renderPage();
    };
  }
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
