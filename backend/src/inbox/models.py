from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Inbox(models.Model):
    id = models.AutoField(primary_key=True)
    inbox_name = models.CharField(max_length=255)
    profile_photo = models.CharField(max_length=255, null=True, default=None)
    is_group = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_muted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.IntegerField(null=True, default=None)
    last_message = models.TextField(null=False, default="")
    last_message_sender = models.IntegerField(null=False, default=0)
    last_message_timestamp = models.BigIntegerField(default=0)

    class Meta:
        db_table = "inbox"


class InboxMember(models.Model):
    id = models.AutoField(primary_key=True)
    inbox = models.ForeignKey(Inbox, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    ROLE_CHOICES = [
        ("admin", "admin"),
        ("user", "user"),
    ]
    role = models.CharField(max_length=255, choices=ROLE_CHOICES, default="user")
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inbox_member"


class Message(models.Model):
    id = models.AutoField(primary_key=True)
    inbox = models.ForeignKey(Inbox, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField(default="")
    has_attachment = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "message"


class MessageStatus(models.Model):
    id = models.AutoField(primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_queued = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    is_delivered = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)
    is_failed = models.BooleanField(default=False)

    class Meta:
        db_table = "message_status"


class Attachment(models.Model):
    id = models.AutoField(primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255, null=False)
    file_type = models.CharField(max_length=255, null=False)
    file_size = models.IntegerField(null=False)
    file_url = models.CharField(max_length=255, null=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attachment"


class MessageReaction(models.Model):
    id = models.AutoField(primary_key=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=255, null=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "message_reaction"
