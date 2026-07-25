# 🎓 ACS Official Attendance System

> **Association of Computer Scientists (ACS)**  
> Palawan State University (PalSU)

The **ACS Attendance System** is the official digital attendance tracking platform for the Association of Computer Scientists at Palawan State University. It is designed to streamline and digitize the process of recording and monitoring member attendance for org meetings, events, and activities — replacing manual sign-in sheets with a reliable, centralized web-based system.

---

## 🛠️ Tech Stack

- **Backend:** Python / Django
- **Database:** SQLite (development)
- **Frontend:** HTML, CSS, JavaScript

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed on your machine:

- [Python 3.10+](https://www.python.org/downloads/)
- pip (comes bundled with Python)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/acscsorg/ACS-Attendance-system.git
cd ACS-Attendance-system
```

---

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

---

### 3. Activate the Virtual Environment

**PowerShell (recommended for Windows):**
```powershell
.\venv\Scripts\Activate.ps1
```

> If you get a script execution error, run this first (one-time fix):
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**Command Prompt (Windows):**
```cmd
.\venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

You'll know the venv is active when your terminal prompt shows `(venv)` at the beginning.

---

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 5. Apply Database Migrations

```bash
python manage.py migrate
```

---

### 6. Run the Development Server

```bash
python manage.py runserver
```

Then open your browser and go to:

```
http://127.0.0.1:8000/
```

---

## 📁 Project Structure

```
ACS-Attendance-system/
├── ACS_Attendance_System/   # Django project config (settings, urls, wsgi)
├── attendance/              # Main Django app
├── venv/                    # Virtual environment (not committed to Git)
├── manage.py
├── requirements.txt
└── README.md
```

---

## 🔄 Updating Dependencies

If you install a new package, update `requirements.txt` by running:

```bash
pip freeze > requirements.txt
```

---

## 👥 Contributing

This project is maintained by members of the **Association of Computer Scientists (ACS)** at Palawan State University. For questions or contributions, please coordinate with the ACS organization officers.

---

## 📄 License

This project is for internal organizational use by ACS — PalSU. All rights reserved.
