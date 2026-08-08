/* ============================= SETTINGS / SEMESTER ============================= */
function renderSettings() {
  const s = state.settings;
  const nextIsPromotion = s.semester === "Second Semester";
  return `
  <div class="panel">
    <div class="panel-head"><h3>Current Term</h3></div>
    <div class="stat-grid" style="grid-template-columns:repeat(2,minmax(160px,1fr));">
      ${statCard("Semester", esc(s.semester), "")}
      ${statCard("Academic Year", esc(s.academicYear), "")}
    </div>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Start New Semester</h3></div>
    <p style="font-size:13px;color:var(--slate);line-height:1.6;max-width:560px;">
      ${
        nextIsPromotion
          ? "This will roll over to <b>First Semester</b> of the next academic year and automatically promote every active student one year level. 4th Year students will be marked as Alumni. All historical attendance records are preserved."
          : "This will move the term forward to <b>Second Semester</b> of the current academic year. No student year levels will change."
      }
    </p>
    <button class="btn btn-brass" id="startSemesterBtn" ${isOffline() ? 'disabled title="Unavailable in offline mode"' : ''}>Start New Semester →</button>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Officer Roster & Access Control</h3></div>
    <div class="toolbar">
      <input class="input" id="newOfficerInput" placeholder="Officer Full Name">
      <input type="password" class="input" id="newOfficerPinInput" placeholder="Assign PIN (min 4 digits)" style="max-width:180px;">
      <button class="btn btn-sm btn-brass" id="addOfficerBtn" ${isOffline() ? 'disabled title="Unavailable in offline mode"' : ''}>+ Add Officer</button>
    </div>
    <table>
      <thead>
        <tr><th>Officer Name</th><th>Status</th><th style="text-align:right;">Actions</th></tr>
      </thead>
      <tbody>
      ${
        state.officers.length
          ? state.officers.map((o) => {
              const oId = typeof o === "object" ? o.id : o;
              const oName = typeof o === "object" ? o.name : o;
              const oStatus = typeof o === "object" ? o.status : "Active";
              return `<tr>
                <td><b>${esc(oName)}</b></td>
                <td><span class="pill ${oStatus === 'Active' ? 'pill-green' : 'pill-rust'}">${esc(oStatus)}</span></td>
                <td style="text-align:right;">
                  <button class="btn btn-sm" data-reset-pin="${oId}" data-officer-name="${esc(oName)}" ${isOffline() ? 'disabled title="Unavailable in offline mode"' : ''}>Reset PIN</button>
                  <button class="btn btn-sm btn-danger" data-del-officer-id="${oId}" data-officer-name="${esc(oName)}" ${isOffline() ? 'disabled title="Unavailable in offline mode"' : ''}>Remove</button>
                </td>
              </tr>`;
            }).join("")
          : '<tr><td colspan="3" class="empty">No officer accounts created yet.</td></tr>'
      }
    </tbody></table>
  </div>
  <div class="panel">
    <div class="panel-head"><h3>Admin Credentials & Security Settings</h3></div>
    <p style="font-size:13px;color:var(--slate);line-height:1.5;margin-bottom:12px;">Update your Super User login credentials below. Current password verification is strictly required for any changes.</p>
    <div class="field" style="max-width:480px;">
      <label>Current Admin Password <span style="color:var(--rust)">*</span></label>
      <input type="password" class="input" id="adminCurrentPassInp" placeholder="Enter current admin password" required>
    </div>
    <div class="field-row" style="max-width:540px;margin-top:10px;">
      <div class="field"><label>Admin Username</label><input class="input" id="adminUserInp" value="${esc(s.adminUsername || 'admin')}"></div>
      <div class="field"><label>New Admin Password</label><input type="password" class="input" id="adminPassInp" placeholder="Enter new password (optional)"></div>
    </div>
    <button class="btn btn-brass" id="saveAdminCredsBtn" style="margin-top:12px;" ${isOffline() ? 'disabled title="Unavailable in offline mode"' : ''}>Save Credentials</button>
  </div>
  `;
}

/* ============================= SEMESTER LOGIC ============================= */
function startNewSemester() {
  const s = state.settings;
  if (s.semester === "First Semester") {
    confirmModal(
      "Move to Second Semester?",
      "This only updates the current semester. Student year levels stay the same.",
      () => {
        s.semester = "Second Semester";
        persist();
        toast("Now in Second Semester", "ok");
        renderPage();
      },
    );
  } else {
    confirmModal(
      "Promote students & start next Academic Year?",
      "Every active student advances one year level (4th Year → Alumni / Archived). Attendance history is kept for all students.",
      () => {
        state.students.forEach((st) => {
          if (st.status !== "Active") return;
          const idx = YEARS.indexOf(st.year);
          if (idx === YEARS.length - 1) {
            st.status = "Inactive";
            st.year = "Alumni";
          } else st.year = YEARS[idx + 1];
        });
        const [y1, y2] = s.academicYear.split("-").map(Number);
        s.academicYear = y1 + 1 + "-" + (y2 + 1);
        s.semester = "First Semester";
        persist();
        toast("New academic year started — students promoted", "ok");
        renderPage();
      },
    );
  }
}

function afterRenderSettings() {
  const startSemBtn = document.getElementById("startSemesterBtn");
  if (startSemBtn) startSemBtn.onclick = startNewSemester;

  const addOffBtn = document.getElementById("addOfficerBtn");
  if (addOffBtn) {
    addOffBtn.onclick = async () => {
      const name = document.getElementById("newOfficerInput").value.trim();
      const pin = document.getElementById("newOfficerPinInput").value.trim();
      if (!name || !pin) {
        toast("Officer name and PIN are required", "err");
        return;
      }
      if (pin.length < 4) {
        toast("Officer PIN must be at least 4 digits", "err");
        return;
      }

      try {
        const res = await fetch("/api/officers/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, pin }),
        });
        const data = await res.json();
        if (res.ok) {
          toast(`Officer ${name} added successfully!`, "ok");
          await loadData();
        } else {
          toast(data.message || "Failed to add officer", "err");
        }
      } catch (e) {
        toast("Network error adding officer", "err");
      }
    };
  }

  document.querySelectorAll("[data-reset-pin]").forEach((btn) => {
    btn.onclick = () => {
      const offId = btn.dataset.resetPin;
      const offName = btn.dataset.officerName;
      openModal(`
        <h3>Reset Officer PIN — ${esc(offName)}</h3>
        <div class="field" style="margin-top:12px;">
          <label>New PIN (min 4 digits)</label>
          <input type="password" class="input" id="resetOffPinInput" placeholder="Enter new PIN" required>
        </div>
        <div class="modal-actions">
          <button class="btn" id="cancelModal">Cancel</button>
          <button class="btn btn-brass" id="saveOffPinBtn">Save New PIN</button>
        </div>
      `);
      document.getElementById("cancelModal").onclick = closeModal;
      document.getElementById("saveOffPinBtn").onclick = async () => {
        const newPin = document.getElementById("resetOffPinInput").value.trim();
        if (!newPin || newPin.length < 4) {
          toast("PIN must be at least 4 digits", "err");
          return;
        }
        const res = await fetch(`/api/officers/${offId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: newPin }),
        });
        if (res.ok) {
          toast(`PIN for ${offName} updated successfully!`, "ok");
          closeModal();
          await loadData();
        } else {
          toast("Failed to update PIN", "err");
        }
      };
    };
  });

  document.querySelectorAll("[data-del-officer-id]").forEach((btn) => {
    btn.onclick = () => {
      const offId = btn.dataset.delOfficerId;
      const offName = btn.dataset.officerName;
      confirmModal(
        "Delete Officer Account?",
        `Are you sure you want to delete officer account <b>${esc(offName)}</b>?`,
        async () => {
          await fetch(`/api/officers/${offId}/`, { method: "DELETE" });
          toast(`Officer ${offName} removed`, "ok");
          await loadData();
        }
      );
    };
  });

  const saveAdminBtn = document.getElementById("saveAdminCredsBtn");
  if (saveAdminBtn) {
    saveAdminBtn.onclick = async () => {
      const curPass = document.getElementById("adminCurrentPassInp").value.trim();
      const u = document.getElementById("adminUserInp").value.trim();
      const p = document.getElementById("adminPassInp").value.trim();

      if (!curPass) {
        toast("Current admin password is required to save changes", "err");
        return;
      }
      if (!u) {
        toast("Admin username cannot be empty", "err");
        return;
      }

      const payload = { current_password: curPass, admin_username: u };
      if (p) {
        if (p.length < 6) {
          toast("New password must be at least 6 characters", "err");
          return;
        }
        payload.new_password = p;
      }

      try {
        const res = await fetch("/api/settings/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast("Admin credentials updated successfully!", "ok");
          document.getElementById("adminCurrentPassInp").value = "";
          document.getElementById("adminPassInp").value = "";
          await loadData();
        } else {
          toast(data.message || "Failed to update admin credentials", "err");
        }
      } catch (e) {
        toast("Network error updating credentials", "err");
      }
    };
  }
}
