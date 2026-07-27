from django.test import TestCase
from django.db import IntegrityError
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
