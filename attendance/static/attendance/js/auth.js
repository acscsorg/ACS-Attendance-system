/* ============================= LOGIN PORTAL ============================= */
function renderLogin() {
  return `
  <div class="login-wrapper">
    <div class="login-card" style="text-align:center;">
      <div class="login-header" style="text-align:center;">
        <img src="/static/attendance/icons/icon-512.png" class="login-logo-img" alt="ACS Logo" style="margin:0 auto 12px auto;display:block;">
        <h2 style="text-align:center;">ACS Attendance</h2>
        <div class="login-sub" style="text-align:center;">Association of Computer Scientists Portal</div>
      </div>

      <form id="loginForm" style="text-align:left;margin-top:20px;">
        <div class="field">
          <label>Username / Student No. / Officer Name</label>
          <input class="input" id="loginIdentifier" placeholder="Enter identifier" autofocus required>
        </div>
        <div class="field">
          <label>Password / PIN</label>
          <input type="password" class="input" id="loginPassword" placeholder="Enter password or PIN" required>
        </div>
        <button type="submit" class="btn btn-brass btn-block" style="margin-top:18px;">Sign In</button>
        <div style="text-align:center;margin-top:14px;">
          <button type="button" id="forgotPasswordBtn" style="background:none;border:none;color:var(--gold,#d4af37);font-size:12.5px;cursor:pointer;text-decoration:underline;">Forgot Password?</button>
        </div>
      </form>
    </div>
  </div>
  `;
}

function showFirstTimePasswordModal(identifier, authPayload) {
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
  `, false);

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
        // Authenticate only AFTER password is successfully updated
        state.auth = {
          role: "student",
          name: authPayload.name || (authPayload.student ? authPayload.student.name : "Student"),
          studentUid: authPayload.student ? authPayload.student.uid : null,
        };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = "student";
        state.page = NAV.student[0].id;

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
  const forgotBtn = document.getElementById("forgotPasswordBtn");
  if (forgotBtn) {
    forgotBtn.onclick = () => {
      confirmModal(
        "Forgot Password?",
        "If you are a student or officer and forgot your password/PIN, please ask the system administrator to reset your credentials.",
        () => {},
      );
    };
  }

  const form = document.getElementById("loginForm");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const iden = document.getElementById("loginIdentifier").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();
    if (!iden || !pass) return;

    const payload = { identifier: iden, password: pass };
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
      if (data.must_change_password) {
        // Do NOT store auth session until password is set
        showFirstTimePasswordModal(iden, data);
      } else {
        state.auth = {
          role: data.role,
          name: data.name || (data.student ? data.student.name : "User"),
          studentUid: data.student ? data.student.uid : null,
        };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = data.role;
        state.page = NAV[data.role][0].id;
        toast(`Logged in successfully as ${state.auth.name}`, "ok");
        render();
      }
      return;
    }

    // Offline Authentication Fallback (When no internet connection is available)
    if (isOfflineLogin) {
      const adminUser = state.settings.adminUsername || "admin";
      if (iden === adminUser && pass) {
        state.auth = { role: "admin", name: "Admin", isOffline: true };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = "admin";
        state.page = NAV.admin[0].id;
        toast("Offline Mode — Logged in locally as Admin", "ok");
        render();
        return;
      }

      const offObj = state.officers.find(
        (o) => (typeof o === "object" ? o.name : o).toLowerCase() === iden.toLowerCase() && (typeof o === "object" ? o.status === "Active" : true)
      );
      if (offObj && pass) {
        const offName = typeof offObj === "object" ? offObj.name : offObj;
        state.auth = { role: "officer", name: offName, isOffline: true };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = "officer";
        state.page = NAV.officer[0].id;
        toast(`Offline Mode — Logged in locally as ${offName}`, "ok");
        render();
        return;
      }

      const idenLower = iden.toLowerCase();
      const stu = state.students.find(
        (s) => (s.uid.toLowerCase() === idenLower || (s.studentNumber || "").toLowerCase() === idenLower) && s.status === "Active"
      );
      if (stu) {
        state.auth = { role: "student", name: stu.name, studentUid: stu.uid, isOffline: true };
        localStorage.setItem("attendqr-auth", JSON.stringify(state.auth));
        state.role = "student";
        state.page = NAV.student[0].id;
        toast(`Offline Mode — Logged in locally as ${stu.name}`, "ok");
        render();
        return;
      }

      toast("Offline Login Failed: Identifier not found in local cache", "err");
      return;
    }

    toast((data && data.message) || "Invalid login credentials", "err");
  };
}
