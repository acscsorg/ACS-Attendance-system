from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/students/', views.student_list_create, name='student_list_create'),
    path('api/students/<str:uid>/', views.student_detail, name='student_detail'),
    path('api/events/', views.event_list_create, name='event_list_create'),
    path('api/events/<int:pk>/', views.event_detail, name='event_detail'),
    path('api/scan/', views.scan_qr, name='scan_qr'),
    path('api/attendance/', views.attendance_list, name='attendance_list'),
    path('api/dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('api/settings/', views.system_settings, name='system_settings'),
    path('api/login/', views.api_login, name='api_login'),
]
