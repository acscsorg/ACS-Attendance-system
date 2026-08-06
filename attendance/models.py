
from django.db import models
from django.contrib.auth.hashers import make_password

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
    password = models.CharField(max_length=128, blank=True)
    is_first_login = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def extract_last_name(self):
        parts = self.name.strip().split()
        if len(parts) > 1:
            return parts[-1].upper()
        return self.name.strip().upper()

    def save(self, *args, **kwargs):
        if not self.password:
            default_pass = self.extract_last_name()
            self.password = make_password(default_pass)
            self.is_first_login = True
        elif not (self.password.startswith('pbkdf2_') or self.password.startswith('argon2') or self.password.startswith('bcrypt')):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.uid})"


class Officer(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    name = models.CharField(max_length=150, unique=True)
    pin = models.CharField(max_length=128)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.pin and not (self.pin.startswith('pbkdf2_') or self.pin.startswith('argon2') or self.pin.startswith('bcrypt')):
            self.pin = make_password(self.pin)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"


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
    admin_username = models.CharField(max_length=100, default='admin')
    admin_password = models.CharField(max_length=128, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.admin_password:
            self.admin_password = make_password('admin123')
        elif not (self.admin_password.startswith('pbkdf2_') or self.admin_password.startswith('argon2') or self.admin_password.startswith('bcrypt')):
            self.admin_password = make_password(self.admin_password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.academic_year} - {self.semester}"
