import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import Student, Event, Attendance, SystemSetting

def index(request):
    return render(request, 'attendance/index.html')

@csrf_exempt
def student_list_create(request):
    if request.method == 'GET':
        students = list(Student.objects.all().values(
            'id', 'uid', 'student_number', 'name', 'course', 'year', 'section', 'status', 'created_at'
        ))
        return JsonResponse(students, safe=False)
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        student = Student.objects.create(
            uid=data['uid'],
            student_number=data['student_number'],
            name=data['name'],
            course=data['course'],
            year=data['year'],
            section=data['section'],
            status=data.get('status', 'Active')
        )
        res_data = {
            'id': student.id,
            'uid': student.uid,
            'student_number': student.student_number,
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
            'name': student.name,
            'course': student.course,
            'year': student.year,
            'section': student.section,
            'status': student.status
        }
        return JsonResponse(res_data)
        
    elif request.method == 'PUT':
        data = json.loads(request.body)
        for field in ['name', 'student_number', 'course', 'year', 'section', 'status']:
            if field in data:
                setattr(student, field, data[field])
        student.save()
        res_data = {
            'id': student.id,
            'uid': student.uid,
            'student_number': student.student_number,
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
        if 'academic_year' in data:
            setting.academic_year = data['academic_year']
        if 'semester' in data:
            setting.semester = data['semester']
        if 'admin_username' in data and data['admin_username'].strip():
            setting.admin_username = data['admin_username'].strip()
        if 'admin_password' in data and data['admin_password'].strip():
            setting.admin_password = data['admin_password'].strip()
        setting.save()
        return JsonResponse({
            'id': setting.id,
            'academic_year': setting.academic_year,
            'semester': setting.semester,
            'admin_username': setting.admin_username,
        }, status=200)


@csrf_exempt
def api_login(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON body'}, status=400)

    role = data.get('role', '').strip()

    if role == 'admin':
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        setting, _ = SystemSetting.objects.get_or_create(id=1)

        if username == setting.admin_username and password == setting.admin_password:
            return JsonResponse({'success': True, 'role': 'admin', 'name': 'Admin'}, status=200)
        else:
            return JsonResponse({'success': False, 'message': 'Invalid admin credentials'}, status=401)

    elif role == 'officer':
        username = data.get('username', '').strip()
        pin = data.get('pin', '').strip()
        if pin == '1234' or not pin:
            return JsonResponse({'success': True, 'role': 'officer', 'name': username or 'Officer'}, status=200)
        else:
            return JsonResponse({'success': False, 'message': 'Invalid officer PIN'}, status=401)

    elif role == 'student':
        identifier = data.get('identifier', '').strip()
        if not identifier:
            return JsonResponse({'success': False, 'message': 'Student UID or Student Number is required'}, status=400)

        student = Student.objects.filter(Q(uid__iexact=identifier) | Q(student_number__iexact=identifier)).first()
        if student:
            return JsonResponse({
                'success': True,
                'role': 'student',
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
        else:
            return JsonResponse({'success': False, 'message': 'Student account not found'}, status=404)

    return JsonResponse({'status': 'error', 'message': 'Invalid role specified'}, status=400)

