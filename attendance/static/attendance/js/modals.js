/* ============================= MODALS ============================= */
function openModal(html, dismissable = true) {
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.id = "modalOverlay";
  wrap.innerHTML = `<div class="modal">${html}</div>`;
  if (dismissable) {
    wrap.onclick = (e) => {
      if (e.target === wrap) closeModal();
    };
  }
  document.body.appendChild(wrap);
}
function closeModal() {
  document.getElementById("modalOverlay")?.remove();
}

function studentModal(uid) {
  const isEdit = !!uid;
  const s = isEdit
    ? studentByUid(uid)
    : {
        studentNumber: "",
        firstName: "",
        lastName: "",
        name: "",
        course: "BS Computer Science",
        year: YEARS[0],
        section: SECTIONS[0],
        status: "Active",
      };

  let fn = s.firstName || "";
  let ln = s.lastName || "";
  if (!fn && !ln && s.name) {
    const parts = s.name.trim().split(" ");
    if (parts.length > 1) {
      fn = parts.slice(0, -1).join(" ");
      ln = parts[parts.length - 1];
    } else {
      fn = s.name;
      ln = s.name;
    }
  }

  openModal(`
    <h3>${isEdit ? "Edit Student" : "Add Student"}</h3>
    <div class="field-row">
      <div class="field"><label>First Name(s)</label><input id="f_first_name" placeholder="e.g. Reymart John" value="${esc(fn)}"></div>
      <div class="field"><label>Last Name</label><input id="f_last_name" placeholder="e.g. Dela Cruz" value="${esc(ln)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Student Number</label><input id="f_num" placeholder="e.g. 2026-8-6767" value="${esc(s.studentNumber)}"></div>
      <div class="field"><label>Status</label><select id="f_status"><option ${s.status === "Active" ? "selected" : ""}>Active</option><option ${s.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div>
    </div>
    <div class="field"><label>Course</label><select id="f_course" disabled style="background:var(--paper);opacity:0.85;cursor:not-allowed;"><option selected>BS Computer Science</option></select></div>
    <div class="field-row">
      <div class="field"><label>Year Level</label><select id="f_year">${YEARS.map((y) => `<option ${s.year === y ? "selected" : ""}>${y}</option>`).join("")}</select></div>
      <div class="field"><label>Section</label><select id="f_section">${SECTIONS.map((x) => `<option ${s.section === x ? "selected" : ""}>${x}</option>`).join("")}</select></div>
    </div>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-brass" id="saveStudent">${isEdit ? "Save Changes" : "Add Student"}</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveStudent").onclick = async () => {
    const firstName = document.getElementById("f_first_name").value.trim();
    const lastName = document.getElementById("f_last_name").value.trim();
    if (!firstName || !lastName) {
      toast("First name and Last name are required", "err");
      return;
    }
    const payload = {
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      student_number: document.getElementById("f_num").value.trim() || "N/A",
      course: "BS Computer Science",
      year: document.getElementById("f_year").value,
      section: document.getElementById("f_section").value,
      status: document.getElementById("f_status").value,
    };
    if (isEdit) {
      const res = await fetch(`/api/students/${s.uid}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Student updated", "ok");
    } else {
      payload.uid = newUid();
      const res = await fetch("/api/students/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Student added", "ok");
    }
    closeModal();
    await loadData();
  };
}
function eventModal(id) {
  const isEdit = !!id;
  const e = isEdit
    ? eventById(id)
    : {
        name: "",
        date: new Date().toISOString().slice(0, 10),
        time: "09:00",
        venue: "",
        description: "",
        status: "Open",
      };
  openModal(`
    <h3>${isEdit ? "Edit Event" : "Create Event"}</h3>
    <div class="field"><label>Event Name</label><input id="e_name" value="${esc(e.name)}"></div>
    <div class="field-row">
      <div class="field"><label>Date</label><input type="date" id="e_date" value="${e.date}"></div>
      <div class="field"><label>Time</label><input type="time" id="e_time" value="${e.time}"></div>
    </div>
    <div class="field"><label>Venue</label><input id="e_venue" value="${esc(e.venue)}"></div>
    <div class="field"><label>Description</label><textarea id="e_desc" rows="3">${esc(e.description)}</textarea></div>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-brass" id="saveEvent">${isEdit ? "Save Changes" : "Create Event"}</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("saveEvent").onclick = async () => {
    const name = document.getElementById("e_name").value.trim();
    if (!name) {
      toast("Event name is required", "err");
      return;
    }
    const payload = {
      name,
      date: document.getElementById("e_date").value,
      time: document.getElementById("e_time").value,
      venue: document.getElementById("e_venue").value.trim(),
      description: document.getElementById("e_desc").value.trim(),
      status: isEdit ? e.status : "Open",
    };
    if (isEdit) {
      const res = await fetch(`/api/events/${e.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Event updated", "ok");
    } else {
      const res = await fetch("/api/events/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast("Event created", "ok");
    }
    closeModal();
    await loadData();
  };
}
function confirmModal(title, msg, onYes) {
  openModal(`
    <h3>${esc(title)}</h3>
    <p style="font-size:13.5px;color:var(--slate);line-height:1.6;">${msg}</p>
    <div class="modal-actions">
      <button class="btn" id="cancelModal">Cancel</button>
      <button class="btn btn-danger" id="confirmYes">Confirm</button>
    </div>
  `);
  document.getElementById("cancelModal").onclick = closeModal;
  document.getElementById("confirmYes").onclick = () => {
    onYes();
    closeModal();
  };
}
