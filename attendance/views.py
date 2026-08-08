import json
import time
from collections import defaultdict
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.utils.dateparse import parse_datetime
from django.contrib.auth.hashers import check_password, make_password
from .models import Student, Event, Attendance, SystemSetting, Officer

# Simple rate limiter for login brute-force protection
FAILED_ATTEMPTS = defaultdict(list)

def is_rate_limited(ip_address, key="global"):
    now = time.time()
    lookup_key = f"{ip_address}:{key}"
    attempts = [t for t in FAILED_ATTEMPTS[lookup_key] if now - t < 900]
    FAILED_ATTEMPTS[lookup_key] = attempts
    return len(attempts) >= 5

def record_failed_attempt(ip_address, key="global"):
    now = time.time()
    lookup_key = f"{ip_address}:{key}"
    FAILED_ATTEMPTS[lookup_key].append(now)

def index(request):
    return render(request, 'attendance/index.html')

@csrf_exempt
def student_list_create(request):
    if request.method == 'GET':
        students = list(Student.objects.all().values(
            'id', 'uid', 'student_number', 'first_name', 'last_name', 'name', 'course', 'year', 'section', 'status', 'created_at'
        ))
        return JsonResponse(students, safe=False)
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        student = Student.objects.create(
            uid=data['uid'],
            student_number=data['student_number'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            name=data['name'],
            course=data.get('course', 'BS Computer Science'),
            year=data['year'],
            section=data['section'],
            status=data.get('status', 'Active')
        )
        res_data = {
            'id': student.id,
            'uid': student.uid,
            'student_number': student.student_number,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'name': student.name,
            'course': student.course,
            'year': student.year,
            'section': student.section,
            'status': student.status
        }
        return JsonResponse(res_data, status=201)

@csrf_exempt
def student_detail(request, uid):
    student = get_object_or_404(Student, uid=uid)
    
    if request.method == 'GET':
        res_data = {
            'id': student.id,
            'uid': student.uid,
            'student_number': student.student_number,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'name': student.name,
            'course': student.course,
            'year': student.year,
            'section': student.section,
            'status': student.status
        }
        return JsonResponse(res_data)
        
    elif request.method == 'PUT':
        data = json.loads(request.body)
        for field in ['first_name', 'last_name', 'name', 'student_number', 'course', 'year', 'section', 'status']:
            if field in data:
                setattr(student, field, data[field])
        student.save()
        res_data = {
            'id': student.id,
            'uid': student.uid,
            'student_number': student.student_number,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'name': student.name,
            'course': student.course,
            'year': student.year,
            'section': student.section,
            'status': student.status
        }
        return JsonResponse(res_data, status=200)
        
    elif request.method == 'DELETE':
        student.delete()
        return HttpResponse(status=204)


@csrf_exempt
def event_list_create(request):
    if request.method == 'GET':
        events = list(Event.objects.all().values(
            'id', 'name', 'date', 'time', 'venue', 'description', 'status', 'created_at'
        ))
        for e in events:
            e['date'] = str(e['date'])
            e['time'] = str(e['time'])
        return JsonResponse(events, safe=False)
        
    elif request.method == 'POST':
        data = json.loads(request.body)
        event = Event.objects.create(
            name=data['name'],
            date=data['date'],
            time=data['time'],
            venue=data['venue'],
            description=data.get('description', ''),
            status=data.get('status', 'Open')
        )
        res_data = {
            'id': event.id,
            'name': event.name,
            'date': str(event.date),
            'time': str(event.time),
            'venue': event.venue,
            'description': event.description,
            'status': event.status
        }
        return JsonResponse(res_data, status=201)

@csrf_exempt
def event_detail(request, pk):
    event = get_object_or_404(Event, pk=pk)
    
    if request.method == 'GET':
        res_data = {
            'id': event.id,
            'name': event.name,
            'date': str(event.date),
            'time': str(event.time),
            'venue': event.venue,
            'description': event.description,
            'status': event.status
        }
        return JsonResponse(res_data)
        
    elif request.method == 'PUT':
        data = json.loads(request.body)
        for field in ['name', 'date', 'time', 'venue', 'description', 'status']:
            if field in data:
                setattr(event, field, data[field])
        event.save()
        res_data = {
            'id': event.id,
            'name': event.name,
            'date': str(event.date),
            'time': str(event.time),
            'venue': event.venue,
            'description': event.description,
            'status': event.status
        }
        return JsonResponse(res_data, status=200)
        
    elif request.method == 'DELETE':
        event.delete()
        return HttpResponse(status=204)


@csrf_exempt
def scan_qr(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        student_uid = data.get('student_uid')
        event_id = data.get('event_id')
        officer = data.get('officer', '')

        # 1. Student check
        try:
            student = Student.objects.get(uid=student_uid)
        except Student.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Student not found'}, status=404)

        if student.status != 'Active':
            return JsonResponse({'status': 'error', 'message': 'Student account is inactive'}, status=400)

        # 2. Event check
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Event not found'}, status=404)

        if event.status != 'Open':
            return JsonResponse({'status': 'error', 'message': 'Event is closed for attendance'}, status=400)

        # 3. Duplicate check
        if Attendance.objects.filter(student=student, event=event).exists():
            return JsonResponse({'status': 'duplicate', 'message': 'Attendance already recorded for this event'}, status=409)

        # 4. Create record
        record = Attendance.objects.create(
            student=student,
            event=event,
            officer=officer
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Attendance recorded',
            'attendance_id': record.id,
            'student_name': student.name,
            'student_uid': student.uid,
            'event_name': event.name,
            'timestamp': record.timestamp.isoformat(),
            'officer': record.officer
        }, status=201)


@csrf_exempt
def attendance_list(request):
    if request.method == 'GET':
        records = Attendance.objects.select_related('student', 'event').all()

        event_id = request.GET.get('event_id')
        student_uid = request.GET.get('student_uid')
        if event_id:
            records = records.filter(event_id=event_id)
        if student_uid:
            records = records.filter(student__uid=student_uid)

        data = [{
            'id': r.id,
            'student_uid': r.student.uid,
            'student_name': r.student.name,
            'event_id': r.event.id,
            'event_name': r.event.name,
            'timestamp': r.timestamp.isoformat(),
            'officer': r.officer
        } for r in records]

        return JsonResponse(data, safe=False)


@csrf_exempt
def dashboard_stats(request):
    if request.method == 'GET':
        total_students = Student.objects.count()
        active_students = Student.objects.filter(status='Active').count()
        total_events = Event.objects.count()
        open_events = Event.objects.filter(status='Open').count()
        total_attendance = Attendance.objects.count()

        max_possible = active_students * total_events
        attendance_pct = round((total_attendance / max_possible) * 100) if max_possible > 0 else 0

        return JsonResponse({
            'total_students': total_students,
            'active_students': active_students,
            'total_events': total_events,
            'open_events': open_events,
            'total_attendance': total_attendance,
            'overall_attendance_pct': attendance_pct
        })


@csrf_exempt
@csrf_exempt
def system_settings(request):
    setting, _ = SystemSetting.objects.get_or_create(id=1)

    if request.method == 'GET':
        return JsonResponse({
            'id': setting.id,
            'academic_year': setting.academic_year,
            'semester': setting.semester,
            'admin_username': setting.admin_username,
        })

    elif request.method in ['PUT', 'POST']:
        data = json.loads(request.body)
        
        # Check if updating admin username or password
        changing_user = 'admin_username' in data and data['admin_username'].strip() != setting.admin_username
        changing_pass = 'new_password' in data and bool(data['new_password'].strip())

        if changing_user or changing_pass:
            current_pass = data.get('current_password', '').strip()
            if not current_pass or not check_password(current_pass, setting.admin_password):
                return JsonResponse({'success': False, 'message': 'Current admin password is required and must be correct to update credentials.'}, status=403)
            
            if changing_user:
                setting.admin_username = data['admin_username'].strip()
            if changing_pass:
                if len(data['new_password'].strip()) < 6:
                    return JsonResponse({'success': False, 'message': 'New admin password must be at least 6 characters.'}, status=400)
                setting.admin_password = make_password(data['new_password'].strip())

        if 'academic_year' in data:
            setting.academic_year = data['academic_year']
        if 'semester' in data:
            setting.semester = data['semester']
        setting.save()

        return JsonResponse({
            'success': True,
            'id': setting.id,
            'academic_year': setting.academic_year,
            'semester': setting.semester,
            'admin_username': setting.admin_username,
        }, status=200)


@csrf_exempt
def officer_list_create(request):
    if request.method == 'GET':
        officers = list(Officer.objects.all().values('id', 'name', 'status', 'created_at'))
        for o in officers:
            o['created_at'] = o['created_at'].isoformat() if o.get('created_at') else ''
        return JsonResponse(officers, safe=False)

    elif request.method == 'POST':
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        pin = data.get('pin', '').strip()
        status = data.get('status', 'Active')

        if not name or not pin:
            return JsonResponse({'success': False, 'message': 'Officer name and PIN are required.'}, status=400)

        if Officer.objects.filter(name__iexact=name).exists():
            return JsonResponse({'success': False, 'message': 'An officer with this name already exists.'}, status=400)

        officer = Officer.objects.create(name=name, pin=pin, status=status)
        return JsonResponse({
            'id': officer.id,
            'name': officer.name,
            'status': officer.status
        }, status=201)


@csrf_exempt
def officer_detail(request, pk):
    officer = get_object_or_404(Officer, pk=pk)

    if request.method == 'GET':
        return JsonResponse({'id': officer.id, 'name': officer.name, 'status': officer.status})

    elif request.method in ['PUT', 'POST']:
        data = json.loads(request.body)
        if 'name' in data and data['name'].strip():
            officer.name = data['name'].strip()
        if 'pin' in data and data['pin'].strip():
            officer.pin = make_password(data['pin'].strip())
        if 'status' in data:
            officer.status = data['status']
        officer.save()
        return JsonResponse({'id': officer.id, 'name': officer.name, 'status': officer.status}, status=200)

    elif request.method == 'DELETE':
        officer.delete()
        return HttpResponse(status=204)


@csrf_exempt
def student_change_password(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    identifier = data.get('identifier', '').strip()
    current_password = data.get('current_password', '').strip()
    new_password = data.get('new_password', '').strip()

    if not identifier or not current_password or not new_password:
        return JsonResponse({'success': False, 'message': 'All fields are required.'}, status=400)

    if len(new_password) < 6:
        return JsonResponse({'success': False, 'message': 'New password must be at least 6 characters long.'}, status=400)

    student = Student.objects.filter(Q(uid__iexact=identifier) | Q(student_number__iexact=identifier)).first()
    if not student:
        return JsonResponse({'success': False, 'message': 'Student account not found.'}, status=404)

    valid_pass = check_password(current_password, student.password)
    if not valid_pass and student.is_first_login:
        pass_upper = current_password.strip().upper()
        last_extracted = student.extract_last_name()
        last_single = student.name.strip().split()[-1].upper() if student.name.strip() else ''
        if (pass_upper == last_extracted or 
            pass_upper == last_single or 
            pass_upper.replace(' ', '') == last_extracted.replace(' ', '')):
            valid_pass = True

    if not valid_pass:
        return JsonResponse({'success': False, 'message': 'Incorrect current password.'}, status=401)

    student.password = make_password(new_password)
    student.is_first_login = False
    student.save()

    return JsonResponse({'success': True, 'message': 'Password updated successfully!'}, status=200)


@csrf_exempt
def student_reset_password(request, uid):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    student = get_object_or_404(Student, uid=uid)
    default_pass = student.extract_last_name()
    student.password = make_password(default_pass)
    student.is_first_login = True
    student.save()

    return JsonResponse({
        'success': True,
        'message': f"Password for {student.name} has been reset to default ({default_pass}). They will be prompted to change it on next login."
    }, status=200)


@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    ip_address = request.META.get('REMOTE_ADDR', '127.0.0.1')
    if is_rate_limited(ip_address):
        return JsonResponse({
            'success': False,
            'message': 'Too many failed login attempts. Please wait 15 minutes before trying again.'
        }, status=429)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON body'}, status=400)

    identifier = (data.get('identifier') or data.get('username') or '').strip()
    password = (data.get('password') or data.get('pin') or '').strip()

    if not identifier or not password:
        return JsonResponse({'success': False, 'message': 'Identifier and password are required.'}, status=400)

    role = data.get('role', '').strip()

    # 1. Admin login check
    setting, _ = SystemSetting.objects.get_or_create(id=1)
    if (not role or role == 'admin') and identifier == setting.admin_username:
        if check_password(password, setting.admin_password):
            return JsonResponse({'success': True, 'role': 'admin', 'name': 'Admin'}, status=200)
        elif role == 'admin':
            record_failed_attempt(ip_address, identifier)
            return JsonResponse({'success': False, 'message': 'Invalid login credentials'}, status=401)

    # 2. Officer login check
    if not role or role == 'officer':
        officer = Officer.objects.filter(name__iexact=identifier, status='Active').first()
        if officer:
            if check_password(password, officer.pin):
                return JsonResponse({'success': True, 'role': 'officer', 'name': officer.name}, status=200)
            elif role == 'officer':
                record_failed_attempt(ip_address, identifier)
                return JsonResponse({'success': False, 'message': 'Invalid login credentials'}, status=401)

    # 3. Student login check
    if not role or role == 'student':
        student = Student.objects.filter(Q(uid__iexact=identifier) | Q(student_number__iexact=identifier), status='Active').first()
        if student:
            valid_pass = check_password(password, student.password)
            if not valid_pass and student.is_first_login:
                pass_upper = password.strip().upper()
                last_extracted = student.extract_last_name()
                last_single = student.name.strip().split()[-1].upper() if student.name.strip() else ''
                if (pass_upper == last_extracted or 
                    pass_upper == last_single or 
                    pass_upper.replace(' ', '') == last_extracted.replace(' ', '')):
                    valid_pass = True

            if valid_pass:
                return JsonResponse({
                    'success': True,
                    'role': 'student',
                    'must_change_password': student.is_first_login,
                    'student': {
                        'id': student.id,
                        'uid': student.uid,
                        'student_number': student.student_number,
                        'name': student.name,
                        'course': student.course,
                        'year': student.year,
                        'section': student.section,
                        'status': student.status
                    }
                }, status=200)
            elif role == 'student':
                record_failed_attempt(ip_address, identifier)
                return JsonResponse({'success': False, 'message': 'Invalid login credentials'}, status=401)

    record_failed_attempt(ip_address, identifier)
    return JsonResponse({'success': False, 'message': 'Invalid login credentials'}, status=401)


@csrf_exempt
def bulk_sync(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        scans = data.get('scans', [])
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)

    results = []
    for item in scans:
        client_id = item.get('client_id')
        student_uid = item.get('student_uid')
        event_id = item.get('event_id')
        officer = item.get('officer', '')

        try:
            student = Student.objects.get(uid=student_uid)
        except Student.DoesNotExist:
            results.append({'client_id': client_id, 'status': 'error', 'message': 'Student not found', 'student_uid': student_uid})
            continue

        if student.status != 'Active':
            results.append({'client_id': client_id, 'status': 'error', 'message': 'Student account is inactive', 'student_uid': student_uid, 'student_name': student.name})
            continue

        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            results.append({'client_id': client_id, 'status': 'error', 'message': 'Event not found', 'student_uid': student_uid})
            continue

        if event.status != 'Open':
            results.append({'client_id': client_id, 'status': 'error', 'message': 'Event is closed for attendance', 'student_uid': student_uid})
            continue

        if Attendance.objects.filter(student=student, event=event).exists():
            results.append({'client_id': client_id, 'status': 'duplicate', 'message': 'Already recorded', 'student_name': student.name, 'student_uid': student.uid})
            continue

        client_ts = item.get('timestamp')
        record = Attendance.objects.create(
            student=student,
            event=event,
            officer=officer
        )
        if client_ts:
            parsed_ts = parse_datetime(client_ts)
            if parsed_ts:
                record.timestamp = parsed_ts
                record.save(update_fields=['timestamp'])
        results.append({
            'client_id': client_id,
            'status': 'success',
            'message': 'Attendance recorded',
            'attendance_id': record.id,
            'student_name': student.name,
            'student_uid': student.uid,
            'event_name': event.name,
            'timestamp': record.timestamp.isoformat(),
            'officer': record.officer
        })

    return JsonResponse({'status': 'success', 'results': results}, status=200)


def service_worker(request):
    import os
    from django.conf import settings
    sw_path = os.path.join(settings.BASE_DIR, 'attendance', 'static', 'attendance', 'sw.js')
    if os.path.exists(sw_path):
        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()
        response = HttpResponse(content, content_type='application/javascript')
        response['Service-Worker-Allowed'] = '/'
        return response
    return HttpResponse('// Service worker not found', content_type='application/javascript', status=404)

