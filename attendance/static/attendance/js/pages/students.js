/* ============================= STUDENTS ============================= */
function renderStudents() {
  const canEdit = state.role === "admin";
  state.stuSearch = state.stuSearch || "";
  state.stuSort = state.stuSort || { key: "name", dir: 1 };
  state.stuPage = state.stuPage || 1;
  const perPage = 10;

  let list = state.students.filter((s) => {
    const q = state.stuSearch.toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.uid.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });
  if (state.stuYearFilter)
    list = list.filter((s) => s.year === state.stuYearFilter);
  if (state.stuStatusFilter)
    list = list.filter((s) => s.status === state.stuStatusFilter);
  list.sort((a, b) => {
    const k = state.stuSort.key;
    const d = state.stuSort.dir;
    return String(a[k]).localeCompare(String(b[k])) * d;
  });

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  if (state.stuPage > totalPages) state.stuPage = totalPages;
  if (state.stuPage < 1) state.stuPage = 1;

  const startIndex = (state.stuPage - 1) * perPage;
  const paginatedList = list.slice(startIndex, startIndex + perPage);

  return `
  <div class="panel no-print">
    <div class="panel-head">
      <h3>${canEdit ? "All Students" : "Student Roster"}</h3>
      <div style="display:flex;gap:8px;">
        ${canEdit ? `<label class="btn btn-sm">Import CSV<input type="file" accept=".csv" id="importCsv" style="display:none"></label>` : ""}
        <button class="btn btn-sm" id="exportStudentsBtn">Export CSV</button>
        ${canEdit ? `<button class="btn btn-brass btn-sm" id="addStudentBtn">+ Add Student</button>` : ""}
      </div>
    </div>
    ${!canEdit ? `<div class="hint" style="margin-bottom:12px;">View only — officers cannot add, edit, or remove student records.</div>` : ""}
    <div class="toolbar">
      <div class="search-wrap">${ICONS.search}<input class="input" id="stuSearchInput" placeholder="Search name, UID, or student no." value="${esc(state.stuSearch)}"></div>
      <select class="select" id="stuYearFilter"><option value="">All Years</option>${YEARS.map((y) => `<option ${state.stuYearFilter === y ? "selected" : ""}>${y}</option>`).join("")}</select>
      <select class="select" id="stuStatusFilter"><option value="">All Status</option><option ${state.stuStatusFilter === "Active" ? "selected" : ""}>Active</option><option ${state.stuStatusFilter === "Inactive" ? "selected" : ""}>Inactive</option></select>
    </div>
    ${
      canEdit
        ? `
    <div class="csv-legend" style="margin-top:10px;margin-bottom:12px;padding:10px 14px;background:var(--panel-sub,#151c2e);border:1px solid var(--line);border-radius:8px;font-size:12px;color:var(--slate);">
      <div style="font-weight:600;color:var(--gold,#d4af37);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <span>📋 CSV Import Column Format</span>
      </div>
      <div style="font-family:monospace;background:var(--bg,#0d111a);padding:6px 10px;border-radius:4px;overflow-x:auto;margin-bottom:6px;white-space:nowrap;">
        uid | studentNumber | name | course | year | section | status
      </div>
      <div style="font-size:11.5px;color:var(--muted,#7c86a8);">
        <b>Example:</b> <code style="font-family:monospace;color:#fff;">ST-2026-0001 | 2023-8-0044 | Lawrence Magnetico | BS Computer Science | 4th Year | 2 | Active</code>
      </div>
    </div>`
        : ""
    }
    <div class="table-wrap">
    <table>
      <thead><tr>
        <th data-sort="uid">UID</th><th data-sort="studentNumber">Student No.</th><th data-sort="name">Name</th>
        <th data-sort="course">Course</th><th data-sort="year">Year</th><th data-sort="section">Section</th>
        <th data-sort="status">Status</th><th>Attendance</th>${canEdit ? "<th></th>" : ""}
      </tr></thead>
      <tbody>
      ${
        paginatedList.length
          ? paginatedList
              .map(
                (s) => `
        <tr>
          <td><span class="uid-chip">${esc(s.uid)}</span></td>
          <td>${esc(s.studentNumber)}</td>
          <td><b>${esc(s.name)}</b></td>
          <td>${esc(s.course)}</td>
          <td>${esc(s.year)}</td>
          <td>${esc(s.section)}</td>
          <td>${s.status === "Active" ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-slate">Inactive</span>'}</td>
          <td>${studentAttendancePct(s.uid)}%</td>
          ${
            canEdit
              ? `<td><div class="row-actions">
            <button class="btn btn-sm" data-edit-student="${esc(s.uid)}">Edit</button>
            <button class="btn btn-sm" data-reset-student="${esc(s.uid)}">Reset Pass</button>
            <button class="btn btn-sm" data-toggle-student="${esc(s.uid)}">${s.status === "Active" ? "Deactivate" : "Activate"}</button>
            <button class="btn btn-sm btn-danger" data-del-student="${esc(s.uid)}">Delete</button>
          </div></td>`
              : ""
          }
        </tr>`,
              )
              .join("")
          : `<tr><td colspan="${canEdit ? 9 : 8}"><div class="empty">No students match your filters.</div></td></tr>`
      }
      </tbody>
    </table>
    </div>
    <div class="pagination-bar" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px solid var(--line);flex-wrap:wrap;gap:10px;">
      <div style="font-size:12.5px;color:var(--slate);">
        Showing <b>${totalItems ? startIndex + 1 : 0}</b> to <b>${Math.min(startIndex + perPage, totalItems)}</b> of <b>${totalItems}</b> students
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-sm" id="stuPrevPage" ${state.stuPage <= 1 ? "disabled" : ""}>← Previous</button>
        <span style="font-size:12.5px;font-weight:600;padding:0 8px;">Page ${state.stuPage} of ${totalPages}</span>
        <button class="btn btn-sm" id="stuNextPage" ${state.stuPage >= totalPages ? "disabled" : ""}>Next →</button>
      </div>
    </div>
  </div>
  `;
}

function afterRenderStudents() {
  const searchInp = document.getElementById("stuSearchInput");
  searchInp.oninput = (e) => {
    state.stuSearch = e.target.value;
    state.stuPage = 1;
    updateStudentList();
  };
  document.getElementById("stuYearFilter").onchange = (e) => {
    state.stuYearFilter = e.target.value;
    state.stuPage = 1;
    updateStudentList();
  };
  document.getElementById("stuStatusFilter").onchange = (e) => {
    state.stuStatusFilter = e.target.value;
    state.stuPage = 1;
    updateStudentList();
  };
  wireStudentListActions();
}

/* Incremental DOM update — only replaces table + pagination, keeps toolbar/search alive */
function updateStudentList() {
  const canEdit = state.role === "admin";
  const perPage = 10;

  let list = state.students.filter((s) => {
    const q = (state.stuSearch || "").toLowerCase();
    return (
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.uid.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q)
    );
  });
  if (state.stuYearFilter)
    list = list.filter((s) => s.year === state.stuYearFilter);
  if (state.stuStatusFilter)
    list = list.filter((s) => s.status === state.stuStatusFilter);
  list.sort((a, b) => {
    const k = state.stuSort.key;
    const d = state.stuSort.dir;
    return String(a[k]).localeCompare(String(b[k])) * d;
  });

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  if (state.stuPage > totalPages) state.stuPage = totalPages;
  if (state.stuPage < 1) state.stuPage = 1;

  const startIndex = (state.stuPage - 1) * perPage;
  const paginatedList = list.slice(startIndex, startIndex + perPage);

  const tableWrap = document.querySelector(".table-wrap");
  if (tableWrap) {
    tableWrap.innerHTML = `
    <table>
      <thead><tr>
        <th data-sort="uid">UID</th><th data-sort="studentNumber">Student No.</th><th data-sort="name">Name</th>
        <th data-sort="course">Course</th><th data-sort="year">Year</th><th data-sort="section">Section</th>
        <th data-sort="status">Status</th><th>Attendance</th>${canEdit ? "<th></th>" : ""}
      </tr></thead>
      <tbody>
      ${
        paginatedList.length
          ? paginatedList
              .map(
                (s) => `
        <tr>
          <td><span class="uid-chip">${esc(s.uid)}</span></td>
          <td>${esc(s.studentNumber)}</td>
          <td><b>${esc(s.name)}</b></td>
          <td>${esc(s.course)}</td>
          <td>${esc(s.year)}</td>
          <td>${esc(s.section)}</td>
          <td>${s.status === "Active" ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-slate">Inactive</span>'}</td>
          <td>${studentAttendancePct(s.uid)}%</td>
          ${
            canEdit
              ? `<td><div class="row-actions">
            <button class="btn btn-sm" data-edit-student="${esc(s.uid)}">Edit</button>
            <button class="btn btn-sm" data-reset-student="${esc(s.uid)}">Reset Pass</button>
            <button class="btn btn-sm" data-toggle-student="${esc(s.uid)}">${s.status === "Active" ? "Deactivate" : "Activate"}</button>
            <button class="btn btn-sm btn-danger" data-del-student="${esc(s.uid)}">Delete</button>
          </div></td>`
              : ""
          }
        </tr>`,
              )
              .join("")
          : `<tr><td colspan="${canEdit ? 9 : 8}"><div class="empty">No students match your filters.</div></td></tr>`
      }
      </tbody>
    </table>`;
  }

  const pagBar = document.querySelector(".pagination-bar");
  if (pagBar) {
    pagBar.innerHTML = `
      <div style="font-size:12.5px;color:var(--slate);">
        Showing <b>${totalItems ? startIndex + 1 : 0}</b> to <b>${Math.min(startIndex + perPage, totalItems)}</b> of <b>${totalItems}</b> students
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-sm" id="stuPrevPage" ${state.stuPage <= 1 ? "disabled" : ""}>← Previous</button>
        <span style="font-size:12.5px;font-weight:600;padding:0 8px;">Page ${state.stuPage} of ${totalPages}</span>
        <button class="btn btn-sm" id="stuNextPage" ${state.stuPage >= totalPages ? "disabled" : ""}>Next →</button>
      </div>`;
  }

  wireStudentListActions();
}

/* Wire table buttons — called after both renderPage and updateStudentList */
function wireStudentListActions() {
  const canEdit = state.role === "admin";
  const prevBtn = document.getElementById("stuPrevPage");
  if (prevBtn)
    prevBtn.onclick = () => {
      if (state.stuPage > 1) {
        state.stuPage--;
        updateStudentList();
      }
    };
  const nextBtn = document.getElementById("stuNextPage");
  if (nextBtn)
    nextBtn.onclick = () => {
      state.stuPage++;
      updateStudentList();
    };
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.onclick = () => {
      const k = th.dataset.sort;
      state.stuSort = {
        key: k,
        dir: state.stuSort.key === k ? -state.stuSort.dir : 1,
      };
      updateStudentList();
    };
  });
  const addStudentBtn = document.getElementById("addStudentBtn");
  if (addStudentBtn) addStudentBtn.onclick = () => studentModal(null);
  document
    .querySelectorAll("[data-edit-student]")
    .forEach((b) => (b.onclick = () => studentModal(b.dataset.editStudent)));
  document.querySelectorAll("[data-reset-student]").forEach((b) => {
    b.onclick = () => {
      const s = studentByUid(b.dataset.resetStudent);
      if (!s) return;
      confirmModal(
        "Reset Student Password?",
        `Are you sure you want to reset the password for <b>${esc(s.name)}</b>?<br><br>Their password will revert to their default capitalized last name, and they will be prompted to set a new password on their next login.`,
        async () => {
          try {
            const res = await fetch(`/api/students/${s.uid}/reset-password/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (res.ok && data.success) {
              toast(data.message || "Password reset successfully", "ok");
              await loadData();
            } else {
              toast((data && data.message) || "Failed to reset password", "err");
            }
          } catch (e) {
            toast("Error resetting password", "err");
          }
        },
      );
    };
  });
  document.querySelectorAll("[data-toggle-student]").forEach(
    (b) =>
      (b.onclick = () => {
        const s = studentByUid(b.dataset.toggleStudent);
        if (!s) return;
        const isDeactivating = s.status === "Active";
        const doToggle = async () => {
          const newStatus = isDeactivating ? "Inactive" : "Active";
          await fetch(`/api/students/${s.uid}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          toast(`Student ${s.name} ${isDeactivating ? "deactivated" : "activated"}`, "ok");
          await loadData();
        };

        if (isDeactivating) {
          confirmModal(
            "Deactivate Student Account?",
            `Are you sure you want to deactivate <b>${esc(s.name)}</b> (${esc(s.uid)})? Deactivated students will be marked inactive and excluded from active event rosters.`,
            doToggle,
          );
        } else {
          doToggle();
        }
      }),
  );
  document.querySelectorAll("[data-del-student]").forEach(
    (b) =>
      (b.onclick = () => {
        const s = studentByUid(b.dataset.delStudent);
        const studentName = s ? s.name : b.dataset.delStudent;
        confirmModal(
          "Delete Student Record Permanently?",
          `Are you sure you want to permanently delete <b>${esc(studentName)}</b> (${esc(b.dataset.delStudent)})?<br><br><span style="color:var(--rust);font-weight:600;">Warning:</span> This action cannot be undone. The student profile, QR badge allocation, and all associated attendance log history will be permanently deleted from the database.`,
          async () => {
            await fetch(`/api/students/${b.dataset.delStudent}/`, {
              method: "DELETE",
            });
            toast(`Student ${studentName} deleted`, "ok");
            await loadData();
          },
        );
      }),
  );
  document.getElementById("exportStudentsBtn").onclick = () => {
    const csv = toCSV(state.students, [
      "uid",
      "studentNumber",
      "name",
      "course",
      "year",
      "section",
      "status",
    ]);
    downloadFile("students.csv", csv, "text/csv");
  };
  const importCsv = document.getElementById("importCsv");
  if (importCsv)
    importCsv.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const rows = parseCSV(reader.result);
          let count = 0;
          let dups = 0;
          let lastErrMsg = null;

          for (const r of rows) {
            if (!r.name) continue;
            const res = await fetch("/api/students/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uid: r.uid || newUid(),
                student_number: r.studentNumber || r.studentnumber || "N/A",
                name: r.name,
                course: r.course || COURSES[0],
                year: r.year || YEARS[0],
                section: r.section || "A",
                status: r.status || "Active",
              }),
            });

            if (res.ok) {
              count++;
            } else {
              dups++;
              try {
                const errData = await res.json();
                if (errData && errData.message) lastErrMsg = errData.message;
              } catch (e) {}
            }
          }

          if (dups > 0) {
            toast(lastErrMsg || `Imported ${count} student(s) (${dups} skipped due to duplicates)`, "info");
          } else {
            toast(`Successfully imported ${count} student(s)`, "ok");
          }
          await loadData();
        } catch (err) {
          toast("Could not parse CSV file", "err");
        }
      };
      reader.readAsText(file);
    };
}

