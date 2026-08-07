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

function afterRenderEvents() {
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
