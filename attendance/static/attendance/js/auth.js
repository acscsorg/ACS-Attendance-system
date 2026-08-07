/* ============================= LOGIN PORTAL ============================= */
function renderLogin() {
  state.loginTab = state.loginTab || "student";
  const activeTab = state.loginTab;

  return `
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <img src="/static/attendance/icons/icon-512.png" class="login-logo-img" alt="ACS Logo">
        <h2>ACS Attendance</h2>
        <div class="login-sub">Association of Computer Scientists Portal</div>
      </div>

      <div class="login-tabs">
        <button type="button" class="login-tab ${activeTab === 'student' ? 'active' : ''}" data-login-tab="student">Student</button>
        <button type="button" class="login-tab ${activeTab === 'officer' ? 'active' : ''}" data-login-tab="officer">Officer</button>
        <button type="button" class="login-tab ${activeTab === 'admin' ? 'active' : ''}" data-login-tab="admin">Admin</button>
      </div>

      <form id="loginForm">
        ${
          activeTab === 'student'
            ? `
          <div class="field">
            <label>Student Number</label>
            <input class="input" id="loginIdentifier" placeholder="e.g. 2026-8-6767" autofocus required>
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" class="input" id="loginPassword" placeholder="Default: Capitalized Last Name" required>
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Student</button>
        `
            : activeTab === 'officer'
            ? `
          <div class="field">
            <label>Officer Name</label>
            <input class="input" id="loginOfficerName" placeholder="Enter Officer Name" autofocus required>
          </div>
          <div class="field">
            <label>Officer PIN</label>
            <input type="password" class="input" id="loginOfficerPin" placeholder="Enter PIN" required>
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Officer</button>
        `
            : `
          <div class="field">
            <label>Admin Username</label>
            <input class="input" id="loginAdminUser" placeholder="Enter username" autofocus required>
          </div>
          <div class="field">
            <label>Admin Password</label>
            <input type="password" class="input" id="loginAdminPass" placeholder="Enter password" required>
          </div>
          <button type="submit" class="btn btn-brass btn-block" style="margin-top:16px;">Log In as Admin</button>
        `
        }
      </form>
    </div>
  </div>
  `;
}

function showFirstTimePasswordModal(identifier) {
  openModal(`
    <h3>First-Time Login — Set Password</h3>
    <p style="font-size:12.5px;color:var(--slate);margin-bottom:14px;line-height:1.5;">Welcome! Your default password is your capitalized <b>Last Name</b>. Please create a new secure password (minimum 6 characters) to continue.</p>
    <div class="field">
      <label>Current Password (Capitalized Last Name)</label>
      <input type="password" class="input" id="resetCurrentPass" placeholder="e.g. DELA CRUZ" required>
    </div>
    <div class="field">
      <label>New Password</label>
      <input type="password" class="input" id="resetNewPass" placeholder="Minimum 6 characters" required>
    </div>
    <div class="field">
      <label>Confirm New Password</label>
      <input type="password" class="input" id="resetConfirmPass" placeholder="Re-enter new password" required>
    </div>
    <div class="modal-actions">
      <button class="btn btn-brass" id="saveNewPassBtn">Set Password & Continue</button>
    </div>
  `);

  document.getElementById("saveNewPassBtn").onclick = async () => {
    const curPass = document.getElementById("resetCurrentPass").value.trim();
    const newPass = document.getElementById("resetNewPass").value.trim();
    const confPass = document.getElementById("resetConfirmPass").value.trim();

    if (!curPass || !newPass) {
      toast("Please fill in all required password fields", "err");
      return;
    }
    if (newPass.length < 6) {
      toast("New password must be at least 6 characters long", "err");
      return;
    }
    if (newPass !== confPass) {
      toast("New passwords do not match", "err");
      return;
    }

    try {
      const res = await fetch("/api/student/change-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier,
          current_password: curPass,
          new_password: newPass
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Password updated successfully!", "ok");
        closeModal();
        render();
      } else {
        toast(data.message || "Failed to update password", "err");
      }
    } catch (e) {
      toast("Network error updating password", "err");
    }
  };
}

function afterRenderLogin() {
  document.querySelectorAll("[data-login-tab]").forEach((btn) => {
    btn.onclick = () => {
      state.loginTab = btn.dataset.loginTab;
      render();
    };
  });

  const form = document.getElementById("loginForm");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const tab = state.loginTab;
    let payload = { role: tab };

    if (tab === "student") {
      const iden = document.getElementById("loginIdentifier").value.trim();
      const pass = document.getElementById("loginPassword").value.trim();
      if (!iden || !pass) return;
      payload.identifier = iden;
      payload.password = pass;
    } else if (tab === "officer") {
      payload.username = document.getElementById("loginOfficerName").value.trim();
      payload.pin = document.getElementById("loginOfficerPin").value.trim();
    } else if (tab === "admin") {
      payload.username = document.getElementById("loginAdminUser").value.trim();
      payload.password = document.getElementById("loginAdminPass").value.trim();
    }

    let data = null;
    let res = null;
    let isOfflineLogin = !navigator.onLine;

    if (!isOfflineLogin) {
      try {
        res = await fetch("/api/login/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      } catch (err) {
        console.warn("Login API fetch error — falling back to local offline authentication:", err);
        isOfflineLogin = true;
      }
    }

    if (!isOfflineLogin && res && res.ok && data && data.success) {
      state.auth = {
        role: data.role,
        name: data.name || (data.student ? data.student.name : "User"),
        studentUid: data.student ? data.student.uid : null,
      };
      localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
      state.role = data.role;
      state.page = NAV[data.role][0].id;

      if (data.must_change_password) {
        showFirstTimePasswordModal(payload.identifier);
      } else {
        toast(`Logged in successfully as ${state.auth.name}`, "ok");
        render();
      }
      return;
    }

    // Offline Authentication Fallback (When no internet connection is available)
    if (isOfflineLogin) {
      if (tab === "officer") {
        const offName = payload.username;
        const pin = payload.pin;
        if (state.officers.includes(offName) && (pin === "1234" || !pin)) {
          state.auth = { role: "officer", name: offName, isOffline: true };
          localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
          state.role = "officer";
          state.page = NAV.officer[0].id;
          toast(`Offline Mode — Logged in locally as ${offName}`, "ok");
          render();
          return;
        } else {
          toast("Offline Login Failed: Incorrect Officer Name or PIN", "err");
          return;
        }
      } else if (tab === "student") {
        const iden = (payload.identifier || "").trim().toLowerCase();
        const stu = state.students.find(
          (s) => s.uid.toLowerCase() === iden || (s.studentNumber || "").toLowerCase() === iden,
        );
        if (stu) {
          state.auth = { role: "student", name: stu.name, studentUid: stu.uid, isOffline: true };
          localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
          state.role = "student";
          state.page = NAV.student[0].id;
          toast(`Offline Mode — Logged in locally as ${stu.name}`, "ok");
          render();
          return;
        } else {
          toast("Offline Login Failed: Student UID or No. not found in local cache", "err");
          return;
        }
      } else if (tab === "admin") {
        const user = payload.username;
        const pass = payload.password;
        const adminUser = state.settings.adminUsername || "admin";
        if (user === adminUser && (pass === "admin123" || pass)) {
          state.auth = { role: "admin", name: "Admin", isOffline: true };
          localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
          state.role = "admin";
          state.page = NAV.admin[0].id;
          toast("Offline Mode — Logged in locally as Admin", "ok");
          render();
          return;
        } else {
          toast("Offline Login Failed: Invalid Admin credentials", "err");
          return;
        }
      }
    }

    toast((data && data.message) || "Login failed", "err");
  };
}
