import json
from django.test import TestCase, Client
from django.db import IntegrityError
from django.urls import reverse
from datetime import date, time
from .models import Student, Event, Attendance, SystemSetting

class StudentModelTest(TestCase):
    def test_create_student_success(self):
        student = Student.objects.create(
            uid="ST-2026-0001",
            student_number="21-1001",
            name="Ana Dela Cruz",
            course="BS Computer Science",
            year="1st Year",
            section="1",
            status="Active"
        )
        self.assertEqual(student.uid, "ST-2026-0001")
        self.assertEqual(str(student), "Ana Dela Cruz (ST-2026-0001)")

    def test_student_unique_uid_constraint(self):
        Student.objects.create(
            uid="ST-2026-0001", student_number="21-1001", name="Ana",
            course="BSCS", year="1st Year", section="1"
        )
        with self.assertRaises(IntegrityError):
            Student.objects.create(
                uid="ST-2026-0001", student_number="21-1002", name="Bea",
                course="BSIT", year="1st Year", section="1"
            )

class EventModelTest(TestCase):
    def test_create_event_success(self):
        event = Event.objects.create(
            name="General Assembly",
            date=date(2026, 8, 15),
            time=time(9, 0),
            venue="Main Auditorium",
            description="Semestral assembly",
            status="Open"
        )
        self.assertEqual(event.name, "General Assembly")
        self.assertEqual(str(event), "General Assembly - 2026-08-15")

class AttendanceModelTest(TestCase):
    def setUp(self):
        self.student = Student.objects.create(
            uid="ST-2026-0001", student_number="21-1001", name="Ana Dela Cruz",
            course="BSCS", year="1st Year", section="1"
        )
        self.event = Event.objects.create(
            name="Org Week Kickoff", date=date(2026, 8, 15), time=time(10, 0),
            venue="Covered Court", status="Open"
        )

    def test_record_attendance_success(self):
        record = Attendance.objects.create(
            student=self.student,
            event=self.event,
            officer="Officer J. Reyes"
        )
        self.assertEqual(record.student, self.student)
        self.assertEqual(record.event, self.event)
        self.assertEqual(str(record), "Ana Dela Cruz @ Org Week Kickoff")

    def test_duplicate_attendance_constraint(self):
        Attendance.objects.create(student=self.student, event=self.event, officer="Officer J. Reyes")
        with self.assertRaises(IntegrityError):
            Attendance.objects.create(student=self.student, event=self.event, officer="Officer M. Santos")

class SystemSettingModelTest(TestCase):
    def test_create_system_setting(self):
        setting = SystemSetting.objects.create(
            academic_year="2026-2027",
            semester="First Semester"
        )
        self.assertEqual(str(setting), "2026-2027 - First Semester")


class StudentAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.student = Student.objects.create(
            uid="ST-2026-0001",
            student_number="21-1001",
            name="Miguel Santos",
            course="BS Computer Science",
            year="2nd Year",
            section="1",
            status="Active"
        )

    def test_list_students(self):
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['uid'], "ST-2026-0001")

    def test_create_student_api(self):
        payload = {
            "uid": "ST-2026-0002",
            "student_number": "21-1002",
            "name": "Bea Reyes",
            "course": "BS Information Technology",
            "year": "1st Year",
            "section": "2",
            "status": "Active"
        }
        response = self.client.post('/api/students/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Student.objects.filter(uid="ST-2026-0002").exists())

    def test_update_student_api(self):
        payload = {
            "name": "Miguel Santos Updated",
            "status": "Inactive"
        }
        response = self.client.put('/api/students/ST-2026-0001/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.name, "Miguel Santos Updated")
        self.assertEqual(self.student.status, "Inactive")

    def test_delete_student_api(self):
        response = self.client.delete('/api/students/ST-2026-0001/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Student.objects.filter(uid="ST-2026-0001").exists())


class EventAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.event = Event.objects.create(
            name="General Assembly",
            date=date(2026, 8, 15),
            time=time(9, 0),
            venue="Main Auditorium",
            description="Semestral assembly",
            status="Open"
        )

    def test_list_events(self):
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], "General Assembly")

    def test_create_event_api(self):
        payload = {
            "name": "Org Week Kickoff",
            "date": "2026-08-20",
            "time": "10:00:00",
            "venue": "Covered Court",
            "description": "Opening ceremony",
            "status": "Open"
        }
        response = self.client.post('/api/events/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Event.objects.filter(name="Org Week Kickoff").exists())

    def test_update_event_api(self):
        payload = {
            "venue": "Function Hall A",
            "status": "Closed"
        }
        response = self.client.put(f'/api/events/{self.event.pk}/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.event.refresh_from_db()
        self.assertEqual(self.event.venue, "Function Hall A")
        self.assertEqual(self.event.status, "Closed")

    def test_delete_event_api(self):
        response = self.client.delete(f'/api/events/{self.event.pk}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Event.objects.filter(pk=self.event.pk).exists())


class AttendanceScanAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.active_student = Student.objects.create(
            uid="ST-2026-0001", student_number="21-1001", name="Ana Dela Cruz",
            course="BSCS", year="1st Year", section="1", status="Active"
        )
        self.inactive_student = Student.objects.create(
            uid="ST-2026-0099", student_number="21-1099", name="Oscar Castillo",
            course="BSIT", year="4th Year", section="1", status="Inactive"
        )
        self.open_event = Event.objects.create(
            name="Org Week Kickoff", date=date(2026, 8, 15), time=time(10, 0),
            venue="Covered Court", status="Open"
        )
        self.closed_event = Event.objects.create(
            name="Leadership Workshop", date=date(2026, 8, 1), time=time(13, 0),
            venue="Function Hall B", status="Closed"
        )

    def test_successful_scan_api(self):
        payload = {
            "student_uid": "ST-2026-0001",
            "event_id": self.open_event.id,
            "officer": "Officer J. Reyes"
        }
        response = self.client.post('/api/scan/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['status'], "success")
        self.assertEqual(data['student_name'], "Ana Dela Cruz")
        self.assertTrue(Attendance.objects.filter(student=self.active_student, event=self.open_event).exists())

    def test_scan_student_not_found_api(self):
        payload = {
            "student_uid": "ST-9999-9999",
            "event_id": self.open_event.id,
            "officer": "Officer J. Reyes"
        }
        response = self.client.post('/api/scan/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertEqual(data['status'], "error")

    def test_scan_inactive_student_api(self):
        payload = {
            "student_uid": "ST-2026-0099",
            "event_id": self.open_event.id,
            "officer": "Officer J. Reyes"
        }
        response = self.client.post('/api/scan/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data['status'], "error")
        self.assertIn("inactive", data['message'].lower())

    def test_scan_closed_event_api(self):
        payload = {
            "student_uid": "ST-2026-0001",
            "event_id": self.closed_event.id,
            "officer": "Officer J. Reyes"
        }
        response = self.client.post('/api/scan/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data['status'], "error")
        self.assertIn("closed", data['message'].lower())

    def test_duplicate_scan_api(self):
        Attendance.objects.create(student=self.active_student, event=self.open_event, officer="Officer J. Reyes")
        
        payload = {
            "student_uid": "ST-2026-0001",
            "event_id": self.open_event.id,
            "officer": "Officer M. Santos"
        }
        response = self.client.post('/api/scan/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 409)
        data = response.json()
        self.assertEqual(data['status'], "duplicate")

    def test_list_attendance_api(self):
        Attendance.objects.create(student=self.active_student, event=self.open_event, officer="Officer J. Reyes")
        response = self.client.get('/api/attendance/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student_uid'], "ST-2026-0001")


class DashboardAndSettingsAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.s1 = Student.objects.create(uid="ST-1", student_number="1", name="A", course="C", year="1", section="1", status="Active")
        self.s2 = Student.objects.create(uid="ST-2", student_number="2", name="B", course="C", year="1", section="1", status="Inactive")
        self.e1 = Event.objects.create(name="E1", date=date(2026, 8, 1), time=time(9, 0), venue="V", status="Open")
        self.e2 = Event.objects.create(name="E2", date=date(2026, 8, 2), time=time(9, 0), venue="V", status="Closed")
        Attendance.objects.create(student=self.s1, event=self.e1, officer="Officer J")

    def test_dashboard_stats_api(self):
        response = self.client.get('/api/dashboard-stats/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total_students'], 2)
        self.assertEqual(data['active_students'], 1)
        self.assertEqual(data['total_events'], 2)
        self.assertEqual(data['open_events'], 1)
        self.assertEqual(data['total_attendance'], 1)

    def test_get_and_update_settings_api(self):
        res = self.client.get('/api/settings/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['academic_year'], "2026-2027")

        payload = {"academic_year": "2027-2028", "semester": "Second Semester"}
        res2 = self.client.put('/api/settings/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2['academic_year'], "2027-2028")
        self.assertEqual(data2['semester'], "Second Semester")
