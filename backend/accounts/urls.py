from django.urls import path
from accounts import views

urlpatterns = [
    path('login', views.login, name='auth-login'),
    path('signup', views.signup, name='auth-signup'),
    path('logout', views.logout, name='auth-logout'),
    path('me', views.me, name='auth-me'),
    path('forgot-password', views.forgot_password, name='auth-forgot-password'),
    path('reset-password', views.reset_password, name='auth-reset-password'),
]
