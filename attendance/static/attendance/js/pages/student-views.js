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

function afterRenderMyQr() {
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

  document.querySelectorAll("#myQrBadge [data-dl]").forEach((btn) => {
    btn.onclick = () => {
      const s = studentByUid(btn.dataset.uid);
      const nameStr = s ? `${s.name}_${s.studentNumber}` : btn.dataset.uid;
      downloadBadgePng(btn.dataset.dl, nameStr);
    };
  });
}

function afterRenderMyAttendance() {
  // No interactive wiring needed for this read-only page
}
