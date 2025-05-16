from django.urls import path

from . import views

app_name = "chat"

urlpatterns = [
    path("<int:user_id>/get-conversations", views.get_conversations_view, name="get_conversations"),
    path("<int:id>/send-message", views.send_message_view, name="send_message"),
]
