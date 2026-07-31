# 🎓 ACS Official Attendance System

> **Association of Computer Scientists (ACS)**  
> Palawan State University (PalSU)

The **ACS Attendance System** is the official digital attendance tracking platform for the Association of Computer Scientists at Palawan State University. It is designed to streamline and digitize the process of recording and monitoring member attendance for org meetings, events, and activities — replacing manual sign-in sheets with a reliable, centralized web-based system.

---

## 🛠️ Tech Stack

- **Backend:** Python / Django
- **Database:** SQLite (Official Final Database)
- **Environment & Dependency Manager:** Pipenv
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6+)

---

## ⚠️ Important Database Note (SQLite)

> [!IMPORTANT]
> **Database File Notice:**  
> **SQLite** is the designated final database for this system. Database files (`db.sqlite3`) are excluded from Git version control to ensure data security and privacy.  
> **Every developer / contributor must generate their own local `db.sqlite3` database file in the project root directory by running `python manage.py migrate` (inside `pipenv shell`) during setup.**

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Python 3.10+](https://www.python.org/downloads/)
- [Pipenv](https://pipenv.pypa.io/en/latest/) (`pip install pipenv` or `py -m pip install pipenv`)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/acscsorg/ACS-Attendance-system.git
cd ACS-Attendance-system
```

---

### 2. Install Dependencies & Activate Pipenv Shell

Install required dependencies:

```bash
pipenv install
```

Activate the Pipenv virtual environment shell:

```bash
pipenv shell
```

Once inside `pipenv shell`, your terminal is automatically environment-configured. You can run all `python` commands directly without prefixing `pipenv run`!

---

### 3. Initialize Your Local SQLite Database

Generate your root `db.sqlite3` database file and apply all migrations:

```bash
python manage.py migrate
```

---

### 4. Run the Development Server

Start the local Django server:

```bash
python manage.py runserver
```

Then open your browser and go to:

```
http://127.0.0.1:8000/
```

---

## 🧪 Running Automated Tests

Run the full backend TDD test suite to verify system integrity:

```bash
python manage.py test attendance
```

---

## 📁 Project Structure

```
ACS-Attendance-system/
├── ACS_Attendance_System/   # Django project config (settings, urls, wsgi)
├── attendance/              # Main Django app (models, views, templates, static)
├── Pipfile                  # Pipenv dependency specifications
├── Pipfile.lock             # Exact dependency lockfile
├── manage.py
└── README.md
```

---

## 🔄 Updating Dependencies

If you add a new package to the project:

```bash
pipenv install <package_name>
```

This will automatically update both `Pipfile` and `Pipfile.lock`.

---

## 👥 Contributing

This project is maintained by members of the **Association of Computer Scientists (ACS)** at Palawan State University. For questions or contributions, please coordinate with the ACS organization officers.

---

## 📄 License

This project is for internal organizational use by ACS — PalSU. All rights reserved.
