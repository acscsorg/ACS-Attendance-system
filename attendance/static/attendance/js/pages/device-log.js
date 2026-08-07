/* ============================= DEVICE AUDIT LOG PAGE ============================= */
function renderDeviceLogPage() {
  setTimeout(() => loadAndRenderDeviceLog(), 50);
  return `
  <div class="panel">
    <div class="panel-head">
      <div>
        <h3>📱 Local Device Scan Audit Trail</h3>
        <div class="hint">Permanent on-device record of all scans recorded by officers on this device</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-sm btn-brass" id="exportDeviceLogBtn">Export CSV</button>
        <button class="btn btn-sm btn-danger" id="clearDeviceLogBtn">Clear Log</button>
      </div>
    </div>
    <div id="deviceLogTableWrap">
      <div class="empty">Loading local audit records...</div>
    </div>
  </div>
  `;
}

async function loadAndRenderDeviceLog() {
  const container = document.getElementById("deviceLogTableWrap");
  if (!container) return;

  let logs = [];
  if (window.OfflineDB) {
    logs = await window.OfflineDB.getDeviceScanHistory();
  }

  if (!logs || !logs.length) {
    container.innerHTML = '<div class="empty">No scan audit logs recorded on this device yet.</div>';
    return;
  }

  const rows = logs.map((l) => {
    let pillClass = "pill-green";
    let statusText = "Synced";

    if (l.sync_status === "pending_offline") {
      pillClass = "pill-blue";
      statusText = "Saved Offline";
    } else if (l.sync_status === "duplicate") {
      pillClass = "pill-amber";
      statusText = "Already Scanned";
    } else if (l.sync_status === "invalid" || l.sync_status === "error") {
      pillClass = "pill-rust";
      statusText = "Invalid / Error";
    }

    const dt = new Date(l.timestamp);
    const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return `
      <tr>
        <td><span class="uid-chip">${esc(l.student_uid)}</span></td>
        <td><b>${esc(l.student_name)}</b></td>
        <td>${esc(l.event_name)}</td>
        <td>${esc(l.officer)}</td>
        <td><span style="font-size:12px;color:var(--slate);">${dateStr} · ${timeStr}</span></td>
        <td><span class="pill ${pillClass}">${statusText}</span></td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student UID</th>
            <th>Name</th>
            <th>Event</th>
            <th>Officer</th>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function afterRenderDeviceLog() {
  const exportBtn = document.getElementById("exportDeviceLogBtn");
  if (exportBtn) {
    exportBtn.onclick = async () => {
      if (!window.OfflineDB) return;
      const logs = await window.OfflineDB.getDeviceScanHistory();
      if (!logs || !logs.length) {
        toast("No audit logs to export", "err");
        return;
      }
      const csvRows = logs.map((l) => ({
        Student_UID: l.student_uid,
        Student_Name: l.student_name,
        Event: l.event_name,
        Officer: l.officer,
        Timestamp: l.timestamp,
        Status: l.sync_status
      }));
      const csvContent = toCSV(csvRows, ["Student_UID", "Student_Name", "Event", "Officer", "Timestamp", "Status"]);
      downloadFile("device_scan_audit_log.csv", csvContent, "text/csv");
      toast("Device scan audit log exported", "ok");
    };
  }
  const clearBtn = document.getElementById("clearDeviceLogBtn");
  if (clearBtn) {
    clearBtn.onclick = async () => {
      if (confirm("Clear local device audit log?")) {
        if (window.OfflineDB) {
          await window.OfflineDB.clearDeviceScanHistory();
          toast("Local audit log cleared", "ok");
          loadAndRenderDeviceLog();
        }
      }
    };
  }
}
