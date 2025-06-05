from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("check-health", views.check_health_view, name="check_health"),
    path("register", view=views.register_view, name="register"),
    path("login", view=views.login_view, name="login"),
    path("logout", view=views.logout_view, name="logout"),
    path("refresh", view=views.CustomTokenRefreshView.as_view(), name="refresh"),
    path("publish-event", view=views.publish_user_event_view, name="publish_user_event"),
]
