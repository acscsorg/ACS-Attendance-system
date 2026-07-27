from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/students/', views.student_list_create, name='student_list_create'),
    path('api/students/<str:uid>/', views.student_detail, name='student_detail'),
]
