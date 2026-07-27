import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
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
