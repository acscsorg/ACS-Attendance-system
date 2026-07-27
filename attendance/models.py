
from django.db import models

class Student(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    uid = models.CharField(max_length=50, unique=True)
    student_number = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    course = models.CharField(max_length=100)
    year = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.uid})"


class Event(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Closed', 'Closed'),
    ]

    name = models.CharField(max_length=150)
    date = models.DateField()
    time = models.TimeField()
    venue = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.date}"


class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    timestamp = models.DateTimeField(auto_now_add=True)
    officer = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'event'], name='unique_student_event_attendance')
        ]

    def __str__(self):
        return f"{self.student.name} @ {self.event.name}"


class SystemSetting(models.Model):
    academic_year = models.CharField(max_length=50, default='2026-2027')
    semester = models.CharField(max_length=50, default='First Semester')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.academic_year} - {self.semester}"
