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
        <rect x="${labelWidth}" y="${y + 6}" width="${w}" height="16" rx="4" fill="#2d6a4f"/>
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

function afterRenderDashboard() {
  document.getElementById("dashEventSelect").onchange = (e) => {
    state.dashEventId = e.target.value;
    renderPage();
  };
}
