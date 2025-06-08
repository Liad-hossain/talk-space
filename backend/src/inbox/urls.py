from django.urls import path

from . import views

app_name = "inbox"

urlpatterns = [
    path("<int:user_id>/chats", views.get_chats_view, name="get_chats"),
    path("<int:inbox_id>/conversations", views.get_conversations_view, name="get_conversations"),
    path("<int:user_id>/users", views.get_users_view, name="get_users"),
    path("<int:user_id>/groups", views.get_groups_view, name="get_groups"),
    path("<int:user_id>/create-group", views.create_group_view, name="create_group"),
    path("<int:receiver_id>/send-message", views.send_message_view, name="send_message"),
    path("<int:inbox_id>/send-group-message", views.send_group_message_view, name="send_group_message"),
    path("<int:inbox_id>/publish-event", views.publish_inbox_event_view, name="publish_inbox_event"),
]
