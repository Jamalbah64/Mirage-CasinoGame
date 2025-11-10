"""Urls file for sending API requests to the views for users"""
from rest_framework.authtoken.views import obtain_auth_token
from django.urls import path
from .views import RegisterView

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", obtain_auth_token),  # POST {"username","password"} -> {"token": "..."}
]
