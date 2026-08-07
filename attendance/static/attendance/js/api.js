/* ============================= PERSISTENCE & API SYNC ============================= */
async function loadData() {
  try {
    const [studentsRes, eventsRes, attendanceRes, settingsRes, officersRes] =
      await Promise.all([
        fetch("/api/students/").then((r) => r.json()),
        fetch("/api/events/").then((r) => r.json()),
        fetch("/api/attendance/").then((r) => r.json()),
        fetch("/api/settings/").then((r) => r.json()),
        fetch("/api/officers/").then((r) => r.json()).catch(() => []),
      ]);

    state.students = (studentsRes || []).map((s) => ({
      id: s.id,
      uid: s.uid,
      studentNumber: s.student_number,
      name: s.name,
      course: s.course,
      year: s.year,
      section: s.section,
      status: s.status,
    }));

    state.events = (eventsRes || []).map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      venue: e.venue,
      description: e.description,
      status: e.status,
    }));

    state.attendance = (attendanceRes || []).map((a) => ({
      id: a.id,
      studentUid: a.student_uid,
      eventId: a.event_id,
      timestamp: a.timestamp,
      officer: a.officer,
    }));

    state.officers = (officersRes || []).map((o) => ({
      id: o.id,
      name: o.name,
      status: o.status,
    }));

    if (settingsRes && settingsRes.academic_year) {
      state.settings = {
        academicYear: settingsRes.academic_year,
        semester: settingsRes.semester,
        adminUsername: settingsRes.admin_username || 'admin',
      };
    }

    if (!state.students.length && !state.events.length) {
      await seedToBackend();
      return loadData();
    }
    persist();
  } catch (e) {
    console.warn("Offline mode detected — loading data from local storage backup:", e);
    try {
      const dataStr = localStorage.getItem("attendqr-data");
      if (dataStr) {
        const cached = JSON.parse(dataStr);
        if (cached.students && cached.students.length) state.students = cached.students;
        if (cached.events && cached.events.length) state.events = cached.events;
        if (cached.attendance) state.attendance = cached.attendance;
        if (cached.settings) state.settings = cached.settings;
        if (cached.officers && cached.officers.length) state.officers = cached.officers;
      }
    } catch (err) {}
  }
  state.ready = true;
  if (state.students.length) state.studentViewUid = state.students[0].uid;
  if (state.officers.length) {
    const activeOff = state.officers.find(o => o.status === 'Active');
    state.officerName = activeOff ? activeOff.name : (typeof state.officers[0] === 'string' ? state.officers[0] : state.officers[0].name);
  }
  render();
}

async function persist() {
  // Local persistence backup
  try {
    const dataStr = JSON.stringify({
      students: state.students,
      events: state.events,
      attendance: state.attendance,
      settings: state.settings,
      officers: state.officers,
    });
    if (window.localStorage) localStorage.setItem("attendqr-data", dataStr);
  } catch (e) {}
}

async function seedToBackend() {
  const names = [
    "Ana Dela Cruz",
    "Miguel Santos",
    "Bea Reyes",
    "Carlo Mendoza",
    "Diana Flores",
    "Ethan Cruz",
    "Fiona Garcia",
    "Gabriel Torres",
    "Hannah Ramos",
    "Ivan Bautista",
    "Jasmine Villanueva",
    "Kyle Aquino",
    "Liza Domingo",
    "Marco Pascual",
    "Nadia Rivera",
    "Oscar Castillo",
    "Paula Navarro",
    "Quinn Salazar",
  ];
  const studentsToCreate = names.map((n, i) => ({
    uid: "ST-2026-" + String(i + 1).padStart(4, "0"),
    student_number: "21-" + String(1000 + i),
    name: n,
    course: COURSES[i % COURSES.length],
    year: YEARS[i % YEARS.length],
    section: SECTIONS[i % SECTIONS.length],
    status: i === 15 ? "Inactive" : "Active",
  }));

  for (const s of studentsToCreate) {
    await fetch("/api/students/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
  }

  const today = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const past1 = new Date(today);
  past1.setDate(today.getDate() - 21);
  const past2 = new Date(today);
  past2.setDate(today.getDate() - 7);
  const upcoming = new Date(today);
  upcoming.setDate(today.getDate() + 10);

  const eventsToCreate = [
    {
      name: "General Assembly",
      date: fmt(past1),
      time: "09:00:00",
      venue: "Main Auditorium",
      description: "Semestral general assembly for all members.",
      status: "Closed",
    },
    {
      name: "Leadership Workshop",
      date: fmt(past2),
      time: "13:00:00",
      venue: "Function Hall B",
      description: "Workshop on officer leadership skills.",
      status: "Closed",
    },
    {
      name: "Org Week Kickoff",
      date: fmt(today),
      time: "10:00:00",
      venue: "Covered Court",
      description: "Opening program for organization week.",
      status: "Open",
    },
    {
      name: "General Assembly Pt. 2",
      date: fmt(upcoming),
      time: "09:00:00",
      venue: "Main Auditorium",
      description: "Follow-up assembly to close the semester.",
      status: "Open",
    },
  ];

  for (const e of eventsToCreate) {
    await fetch("/api/events/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e),
    });
  }
}
function mkAtt(uid, eventId, dateObj, officer) {
  const d = new Date(dateObj);
  d.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 59));
  return {
    id: "AT-" + Math.random().toString(36).slice(2, 9),
    studentUid: uid,
    eventId,
    timestamp: d.toISOString(),
    officer,
  };
}
function makeUid(n) {
  return (
    "ST-" + state?.settings?.academicYear?.slice(0, 4) ||
    2026 + "-" + String(n).padStart(4, "0")
  );
}
function newUid() {
  const seq = state.students.length + 1;
  const yr = (state.settings.academicYear || "2026").slice(0, 4);
  return "ST-" + yr + "-" + String(seq).padStart(4, "0");
}
