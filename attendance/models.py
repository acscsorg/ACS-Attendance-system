
from django.db import models
from django.contrib.auth.hashers import make_password

class Student(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]

    uid = models.CharField(max_length=50, unique=True)
    student_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100, blank=True, default='')
    last_name = models.CharField(max_length=100, blank=True, default='')
    name = models.CharField(max_length=150)
    course = models.CharField(max_length=100, default='BS Computer Science')
    year = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    password = models.CharField(max_length=128, blank=True)
    is_first_login = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def extract_last_name(self):
        if self.last_name and self.last_name.strip():
            return self.last_name.strip().upper()
        parts = self.name.strip().split()
        if len(parts) <= 1:
            return self.name.strip().upper()

        prefixes = {'DELA', 'DE', 'DEL', 'SAN', 'SANTA', 'SANTO', 'LA', 'LAS', 'LOS', 'DA', 'DOS', 'VAN', 'VON'}

        # 3-part compound last names (e.g., "De La Cruz", "De Los Santos")
        if len(parts) >= 3 and parts[-3].upper() in prefixes and parts[-2].upper() in prefixes:
            return f"{parts[-3]} {parts[-2]} {parts[-1]}".upper()

        # 2-part compound last names (e.g., "Dela Cruz", "San Juan")
        if len(parts) >= 2 and parts[-2].upper() in prefixes:
            return f"{parts[-2]} {parts[-1]}".upper()

        return parts[-1].upper()

    def save(self, *args, **kwargs):
        if self.name:
            parts = self.name.strip().split()
            if len(parts) > 1:
                derived_fn = " ".join(parts[:-1])
                derived_ln = parts[-1]
                if not self.first_name or not self.last_name or f"{self.first_name} {self.last_name}" != self.name:
                    self.first_name = derived_fn
                    self.last_name = derived_ln
            else:
                if not self.first_name or not self.last_name or f"{self.first_name} {self.last_name}" != self.name:
                    self.first_name = self.name
                    self.last_name = self.name
        elif self.first_name and self.last_name:
            self.name = f"{self.first_name.strip()} {self.last_name.strip()}"

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
