from rest_framework import serializers


class QueryParamSerializer(serializers.Serializer):
    offset = serializers.IntegerField(required=False, allow_null=True, default=0)
    limit = serializers.IntegerField(required=False, allow_null=True, default=10)
    is_active = serializers.BooleanField(required=False, allow_null=True, default=None)
    search = serializers.CharField(required=False, allow_null=True, default=None)


class MessageSerializer(serializers.Serializer):
    sender_id = serializers.IntegerField(required=True)
    receiver_id = serializers.IntegerField(required=True)
    text = serializers.CharField(required=True, max_length=255)
    attachments = serializers.ListField(child=serializers.FileField(), required=True)


class GroupMessageSerializer(serializers.Serializer):
    sender_id = serializers.IntegerField(required=True)
    text = serializers.CharField(required=True, max_length=255)
    attachments = serializers.ListField(child=serializers.FileField(), required=True)


class ChatSerializer(serializers.Serializer):
    inbox_id = serializers.IntegerField(required=True)
    inbox_name = serializers.CharField(max_length=255, allow_blank=True, allow_null=True, default="")
    profile_photo = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255, default="")
    is_group = serializers.BooleanField(default=False)
    inbox_members = serializers.ListField(child=serializers.DictField(), required=True)
    last_message = serializers.CharField(max_length=255, allow_blank=True, default="")
    last_message_timestamp = serializers.IntegerField(required=True)
    last_message_sender = serializers.IntegerField(required=True)
    unseen_count = serializers.IntegerField(default=0)
    is_active = serializers.BooleanField(default=False)
    last_active_time = serializers.DateTimeField(required=False, allow_null=True, default=None)


class ConversationSerializer(serializers.Serializer):
    message_id = serializers.IntegerField(required=True)
    sender_id = serializers.IntegerField(required=True)
    sender_name = serializers.CharField(required=True, max_length=255)
    sender_status = serializers.CharField(required=True, max_length=255)
    sender_profile_photo = serializers.CharField(required=False, allow_null=True, max_length=255)
    text = serializers.CharField(required=True, max_length=255)
    has_attachment = serializers.BooleanField(required=True)
    attachments = serializers.ListField(child=serializers.DictField(), required=True)
    created_at = serializers.DateTimeField(required=True)
    updated_at = serializers.DateTimeField(required=True)


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    inbox_id = serializers.IntegerField(required=False, default="")
    username = serializers.CharField(required=True, max_length=255)
    first_name = serializers.CharField(required=True, allow_blank=True, max_length=255)
    last_name = serializers.CharField(required=True, allow_blank=True, max_length=255)
    profile_photo = serializers.CharField(required=False, allow_null=True, max_length=255)
    status = serializers.CharField(required=True, max_length=255)
    inbox_members = serializers.ListField(child=serializers.DictField(), required=True)
    is_active = serializers.BooleanField(default=False)
    last_active_time = serializers.DateTimeField(required=False, allow_null=True, default=None)


class GroupSerializer(serializers.Serializer):
    inbox_id = serializers.IntegerField(required=True)
    inbox_name = serializers.CharField(required=True, max_length=255)
    profile_photo = serializers.CharField(required=False, allow_null=True, max_length=255)
    inbox_members = serializers.ListField(child=serializers.DictField(), required=True)
    is_active = serializers.BooleanField(default=False)
    last_active_time = serializers.DateTimeField(required=False, allow_null=True, default=None)


class GroupCreationSerializer(serializers.Serializer):
    inbox_name = serializers.CharField(required=True, max_length=255)
    inbox_members = serializers.ListField(child=serializers.IntegerField(), required=True)
