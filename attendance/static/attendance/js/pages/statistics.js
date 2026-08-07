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

function afterRenderStatistics() {
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
