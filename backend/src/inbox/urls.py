from django.urls import path

from . import views

app_name = "inbox"

urlpatterns = [
    path("<int:user_id>/chats", views.get_chats_view, name="get_chats"),
    path("<int:inbox_id>/conversations", views.get_conversations_view, name="get_conversations"),
    path("<int:user_id>/users", views.get_users_view, name="get_users"),
    path("<int:user_id>/groups", views.get_groups_view, name="get_groups"),
    path("<int:receiver_id>/send-message", views.send_message_view, name="send_message"),
]
