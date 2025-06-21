import logging
import traceback
from .models import Inbox, Message, InboxMember, MessageStatus, Attachment
from accounts.models import User
from .serializers import (
    MessageSerializer,
    ChatSerializer,
    ConversationSerializer,
    UserSerializer,
    GroupSerializer,
    GroupCreationSerializer,
    GroupMessageSerializer,
    GroupDetailsSerializer,
)
from helpers.custom_exception import DRFViewException, convert_exception_string_to_one_line
from rest_framework import status
from django.db.models import Q, F, Count, OuterRef, Subquery, IntegerField, QuerySet
from externals.pusher import trigger_pusher
from helpers.const import UserStatus, InboxEvents, Others
from datetime import datetime, timezone
from rest_framework.exceptions import APIException
from helpers.utils import upload_image_to_cloudinary


logger = logging.getLogger("stdout")


def get_chats(user_id: int, offset: int = 0, limit: int = 20, **kwargs) -> list[dict]:
    logger.info("Starting get chats process....")
    chats = list()
    try:
        unseen_count = (
            MessageStatus.objects.filter(
                message__inbox=OuterRef("pk"),
                user_id=user_id,
                is_seen=False,
            )
            .values("message__inbox")
            .annotate(unseen_count=Count("id"))
            .values("unseen_count")
        )

        query = Q(inboxmember__user_id=user_id)
        search = kwargs.get("search", None)
        if search:
            query = query & Q(inboxmember__nickname__icontains=search)
        inboxes = (
            Inbox.objects.filter(query)
            .annotate(unseen_count=Subquery(unseen_count, output_field=IntegerField()))
            .order_by("-last_message_timestamp")[offset : offset + limit]
        )

        for inbox in inboxes:
            inbox_members = InboxMember.objects.filter(
                inbox_id=inbox.id,
            )

            receiver_id = None
            receiver_name = None
            receiver_photo = None
            last_message_sender_name = None
            members = list()
            user_id_list = list()
            for member in inbox_members:
                members.append(
                    {
                        "user_id": member.user_id,
                        "nickname": member.nickname,
                        "username": member.user.username,
                        "profile_photo": member.user.userinfo.profile_photo,
                        "role": member.role,
                        "is_blocked": member.is_blocked,
                        "is_archived": member.is_archived,
                        "is_muted": member.is_muted,
                        "created_at": member.created_at,
                    }
                )
                if member.user_id != user_id:
                    receiver_id = member.user_id
                    receiver_name = member.user.username
                    receiver_photo = member.user.userinfo.profile_photo
                    user_id_list.append(member.user_id)

            last_message_sender_name = (
                ""
                if not inbox.last_message_sender
                else member.user.first_name
                if inbox.last_message_sender == receiver_id
                else "You"
            )

            inbox_data = inbox.__dict__
            inbox_data["inbox_id"] = inbox_data.pop("id")
            inbox_data["inbox_members"] = members
            inbox_data["unseen_count"] = inbox_data["unseen_count"] if inbox_data["unseen_count"] else 0
            if inbox.last_message:
                inbox_data["last_message"] = (
                    last_message_sender_name + ("" if not last_message_sender_name else ": ") + inbox.last_message
                )

            if not inbox.is_group and receiver_id:
                user = User.objects.filter(id=receiver_id).only("id", "username").first()
                if user:
                    inbox_data["inbox_name"] = receiver_name
                    inbox_data["is_active"] = user.userinfo.status == UserStatus.ACTIVE
                    inbox_data["last_active_time"] = user.userinfo.last_active_time
                    inbox_data["profile_photo"] = receiver_photo

            if inbox.is_group:
                inbox_data["inbox_name"] = inbox.inbox_name
                active_count = User.objects.filter(id__in=user_id_list, userinfo__status=UserStatus.ACTIVE).count()
                inbox_data["is_active"] = active_count > 0
                inbox_data["profile_photo"] = inbox.profile_photo

            serializer = ChatSerializer(data=inbox_data)
            if not serializer.is_valid():
                logger.error(
                    {
                        "message": "Invalid data format, serializer validation failed.",
                        "error": serializer.errors,
                    }
                )
                raise DRFViewException(
                    detail="Invalid data format, serializer validation failed.", status_code=status.HTTP_400_BAD_REQUEST
                )

            chats.append(serializer.data)
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception:
        logger.error(
            {
                "message": "Couldn't get chats.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't get chats.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending get chats process....")
    return chats


def get_conversations(inbox_id: int, offset: int = 0, limit: int = 20, **kwargs) -> list[dict]:
    logger.info("Starting get conversations process....")
    conversations = list()

    try:
        messages = Message.objects.filter(inbox_id=inbox_id, is_deleted=False).order_by("-created_at")[
            offset : offset + limit
        ]

        for message in messages:
            attachment = ""
            if message.has_attachment:
                attachment = Attachment.objects.filter(message_id=message.id, is_deleted=False).only("file_url").first()
                attachment = attachment.file_url if attachment else ""

            conversation_data = message.__dict__
            conversation_data["sender_name"] = message.sender.username
            conversation_data["sender_status"] = message.sender.userinfo.status
            conversation_data["sender_profile_photo"] = message.sender.userinfo.profile_photo
            conversation_data["message_id"] = conversation_data.pop("id")
            conversation_data["attachment"] = attachment
            serializer = ConversationSerializer(data=conversation_data)
            if not serializer.is_valid():
                logger.error(
                    {
                        "message": "Invalid data format, serializer validation failed.",
                        "error": serializer.errors,
                    }
                )
                raise DRFViewException(
                    detail="Invalid data format, serializer validation failed.", status_code=status.HTTP_400_BAD_REQUEST
                )

            conversations.append(serializer.data)
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception:
        logger.error(
            {
                "message": "Couldn't get conversations.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't get conversations.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending get conversations process....")
    return conversations


def get_users(user_id: int, is_active: bool | None = None, offset: int = 0, limit: int = 20, **kwargs) -> list[dict]:
    logger.info("Starting get all users process....")
    users = list()
    try:
        query = ~Q(id=user_id)
        if is_active is None:
            query &= Q(userinfo__status__in=[UserStatus.ACTIVE, UserStatus.INACTIVE])
        elif is_active:
            query &= Q(userinfo__status=UserStatus.ACTIVE)
        else:
            query &= Q(userinfo__status=UserStatus.INACTIVE)

        search = kwargs.get("search", None)
        if search:
            query &= Q(username__icontains=search)
        users_qs = (
            User.objects.filter(query)
            .annotate(
                profile_photo=F("userinfo__profile_photo"),
                status=F("userinfo__status"),
                last_active_time=F("userinfo__last_active_time"),
                created_at=F("userinfo__created_at"),
            )
            .values(
                "id", "username", "first_name", "last_name", "profile_photo", "status", "last_active_time", "created_at"
            )
            .order_by("-userinfo__created_at")[offset : offset + limit]
        )

        myself = (
            User.objects.filter(id=user_id)
            .annotate(
                profile_photo=F("userinfo__profile_photo"),
                status=F("userinfo__status"),
                last_active_time=F("userinfo__last_active_time"),
                created_at=F("userinfo__created_at"),
            )
            .values(
                "id", "username", "first_name", "last_name", "profile_photo", "status", "last_active_time", "created_at"
            )
            .first()
        )

        my_object = {
            "user_id": myself["id"],
            "nickname": "",
            "username": myself["username"],
            "profile_photo": myself["profile_photo"],
            "role": "user",
            "created_at": myself["created_at"],
        }

        for user in users_qs:
            inbox = (
                Inbox.objects.annotate(
                    user_count=Count("inboxmember__user_id", distinct=True),
                )
                .filter(
                    user_count=2,
                    inboxmember__user_id__in=[user["id"], user_id],
                )
                .annotate(
                    final_user_count=Count("inboxmember__user_id", distinct=True),
                )
                .filter(final_user_count=2)
            )

            members = list()
            if inbox.exists():
                inbox_members = InboxMember.objects.filter(
                    inbox_id=inbox[0].id,
                )
                for member in inbox_members:
                    members.append(
                        {
                            "user_id": member.user_id,
                            "nickname": member.nickname,
                            "username": member.user.username,
                            "profile_photo": member.user.userinfo.profile_photo,
                            "role": member.role,
                            "created_at": member.created_at,
                            "is_blocked": member.is_blocked,
                            "is_archived": member.is_archived,
                            "is_muted": member.is_muted,
                        }
                    )
            else:
                members.append(
                    {
                        "user_id": user["id"],
                        "nickname": "",
                        "username": user["username"],
                        "profile_photo": user["profile_photo"],
                        "role": "user",
                        "created_at": user["created_at"],
                    }
                )
                members.append(my_object)

            user["inbox_members"] = members
            user["inbox_id"] = inbox[0].id if inbox.exists() else 0
            user["is_active"] = user["status"] == UserStatus.ACTIVE
            serializer = UserSerializer(data=user)
            if not serializer.is_valid():
                logger.error(
                    {
                        "message": "Invalid data format, serializer validation failed.",
                        "error": serializer.errors,
                    }
                )
                raise DRFViewException(
                    detail="Invalid data format, serializer validation failed.", status_code=status.HTTP_400_BAD_REQUEST
                )

            users.append(serializer.data)
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)

    except Exception:
        logger.error(
            {
                "message": "Couldn't get all users.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't get all users.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending get all users process....")
    return users


def get_groups(user_id: int, offset: int = 0, limit: int = 20, **kwargs) -> list[dict]:
    logger.info("Starting get groups process....")
    groups = list()
    try:
        query = Q(inboxmember__user_id=user_id) & Q(is_group=True)
        search = kwargs.get("search", None)
        if search:
            query &= Q(inbox_name__icontains=search)
        groups_qs = (
            Inbox.objects.filter(query)
            .only("id", "inbox_name", "profile_photo")
            .order_by("-last_message_timestamp")[offset : offset + limit]
        )

        for group in groups_qs:
            inbox_members = InboxMember.objects.filter(
                inbox_id=group.id,
            )
            members = list()
            user_id_list = list()
            for member in inbox_members:
                members.append(
                    {
                        "user_id": member.user_id,
                        "nickname": member.nickname,
                        "username": member.user.username,
                        "profile_photo": member.user.userinfo.profile_photo,
                        "role": member.role,
                        "is_blocked": member.is_blocked,
                        "is_archived": member.is_archived,
                        "is_muted": member.is_muted,
                        "created_at": member.created_at,
                    }
                )
                if member.user_id != user_id:
                    user_id_list.append(member.user_id)

            group_data = group.__dict__
            group_data["inbox_id"] = group_data.pop("id")
            group_data["inbox_members"] = members
            active_count = User.objects.filter(id__in=user_id_list, userinfo__status=UserStatus.ACTIVE).count()
            group_data["is_active"] = active_count > 0
            serializer = GroupSerializer(data=group.__dict__)
            if not serializer.is_valid():
                logger.error(
                    {
                        "message": "Invalid data format, serializer validation failed.",
                        "error": serializer.errors,
                    }
                )
                raise DRFViewException(
                    detail="Invalid data format, serializer validation failed.", status_code=status.HTTP_400_BAD_REQUEST
                )
            groups.append(serializer.data)
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.error(
            {
                "message": "Couldn't get groups.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't get groups.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending get groups process....")
    return groups


def create_group(user_id: int, data: dict, **kwargs) -> bool:
    logger.info("Starting group creation process....")
    try:
        serializer = GroupCreationSerializer(data=data)
        if not serializer.is_valid():
            message = f"Could not validate the data provided by the user for creating group.Data: {data}"
            logger.error(msg={"message": message, "error": serializer.errors})
            raise DRFViewException(
                detail="The data provided is not valid.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        inbox = Inbox.objects.create(
            inbox_name=serializer.validated_data.get("inbox_name", ""),
            is_group=True,
            created_by=user_id,
            last_message_timestamp=int(datetime.now(timezone.utc).timestamp()),
        )

        InboxMember.objects.create(
            inbox_id=inbox.id,
            user_id=user_id,
            role="admin",
        )

        for id in serializer.validated_data.get("inbox_members", []):
            InboxMember.objects.create(
                inbox_id=inbox.id,
                user_id=id,
                role="user",
            )

    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.error(
            {
                "message": "Couldn't create group.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't create group.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Group is created successfully.Ending group creation process....")
    return True


def send_message(receiver_id: int, data: dict, **kwargs) -> bool:
    logger.info("Starting send message process....")
    try:
        serializer = MessageSerializer(data=data)
        if not serializer.is_valid():
            message = f"Could not validate the data provided by the user for sending message. Data: {data}"
            logger.error(msg={"message": message, "error": serializer.errors})
            raise DRFViewException(
                detail="The data provided is not valid.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        sender = User.objects.filter(id=serializer.validated_data.get("sender_id", 0))
        if not sender.exists():
            raise DRFViewException(detail="Sender does not exist.", status_code=status.HTTP_400_BAD_REQUEST)
        else:
            sender = sender.first()

        receiver = User.objects.filter(id=receiver_id)
        if not receiver.exists():
            raise DRFViewException(detail="Receiver does not exist.", status_code=status.HTTP_400_BAD_REQUEST)
        else:
            receiver = receiver.first()

        current_timestamp = int(datetime.now(timezone.utc).timestamp())
        inbox = (
            Inbox.objects.annotate(
                user_count=Count("inboxmember__user_id", distinct=True),
            )
            .filter(
                user_count=2,
                inboxmember__user_id__in=[serializer.validated_data.get("sender_id", 0), receiver_id],
            )
            .annotate(
                final_user_count=Count("inboxmember__user_id", distinct=True),
            )
            .filter(final_user_count=2)
            .only("id")
        )

        last_message = serializer.validated_data.get("text", "")[: Others.LAST_MESSAGE_LENGTH]
        if len(serializer.validated_data.get("text", "")) > Others.LAST_MESSAGE_LENGTH:
            last_message += "..."

        attachment = serializer.validated_data.get("attachment", None)
        if attachment:
            last_message = "📸 photo"

        if not inbox.exists():
            inbox = Inbox.objects.create(
                inbox_name="",
                is_group=False,
                last_message=last_message,
                last_message_sender=serializer.validated_data.get("sender_id", 0),
                last_message_timestamp=current_timestamp,
            )
            InboxMember.objects.create(
                inbox=inbox,
                user_id=serializer.validated_data.get("sender_id", 0),
                nickname=sender.username,
                role="user",
            )
            InboxMember.objects.create(
                inbox=inbox,
                user_id=receiver_id,
                nickname=receiver.username,
                role="user",
            )

        else:
            Inbox.objects.filter(id=inbox.first().id).update(
                last_message=last_message,
                last_message_sender=serializer.validated_data.get("sender_id", 0),
                last_message_timestamp=current_timestamp,
            )

        message = Message.objects.create(
            inbox_id=inbox.first().id if isinstance(inbox, QuerySet) else inbox.id,
            sender_id=serializer.validated_data.get("sender_id", 0),
            text=serializer.validated_data.get("text", ""),
            has_attachment=(serializer.validated_data.get("attachment", None) is not None),
        )

        message_status = MessageStatus.objects.create(
            message=message,
            user_id=receiver_id,
            is_queued=True,
        )

        file_url = ""
        if attachment:
            file_url = upload_image_to_cloudinary(attachment)
            Attachment.objects.create(
                message=message,
                file_name=attachment.name,
                file_type=attachment.content_type,
                file_size=attachment.size,
                file_url=file_url,
            )

        try:
            # Inbox Event for the left side chatbox
            response = trigger_pusher(
                channels=[f"inbox_{receiver_id}"],
                event="inbox",
                data={
                    "inbox_id": inbox.first().id if isinstance(inbox, QuerySet) else inbox.id,
                    "sender_id": sender.id,
                    "message": sender.first_name + ": " + last_message,
                    "timestamp": serializer.validated_data.get("timestamp", current_timestamp),
                },
            )
            if not response:
                logger.info("Couldn't send inbox event. Received false response from pusher.")
                return False
            else:
                logger.info(f"Inbox event sent successfully to channels: {[f'inbox_{receiver_id}']}.")

            # Message Event for the conversations
            response = trigger_pusher(
                channels=[f"message_{receiver_id}"],
                event="message",
                data={
                    "inbox_id": inbox.first().id if isinstance(inbox, QuerySet) else inbox.id,
                    "message_id": message.id,
                    "sender_id": sender.id,
                    "sender_name": sender.username,
                    "sender_status": sender.userinfo.status,
                    "sender_profile_photo": sender.userinfo.profile_photo,
                    "text": serializer.validated_data.get("text", ""),
                    "has_attachment": message.has_attachment,
                    "attachment": file_url,
                    "created_at": message.created_at.isoformat(),
                    "updated_at": message.updated_at.isoformat(),
                },
            )
            if not response:
                logger.info("Couldn't send message event. Received false response from pusher.")
                return False
            else:
                logger.info(f"Message event sent successfully to channels: {[f'message_{receiver_id}']}.")

            message_status.is_sent = True
            message_status.save(update_fields=["is_sent"])
        except Exception:
            logger.error(
                {
                    "message": "Couldn't send message via pusher.",
                    "error": convert_exception_string_to_one_line(traceback.format_exc()),
                }
            )
            message_status.is_failed = True
            message_status.save(update_fields=["is_failed"])
            return False
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.error(
            {
                "message": "Couldn't send message.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't send message.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending send message process....")
    return True


def send_group_message(inbox_id: int, data: dict, **kwargs) -> bool:
    logger.info("Starting group message sending process....")
    try:
        serializer = GroupMessageSerializer(data=data)
        if not serializer.is_valid():
            message = f"Could not validate the data provided by the user for sending group message. Data: {data}"
            logger.error(msg={"message": message, "error": serializer.errors})
            raise DRFViewException(
                detail="The data provided is not valid.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        sender = User.objects.filter(id=serializer.validated_data.get("sender_id", 0))
        if not sender.exists():
            raise DRFViewException(detail="Sender does not exist.", status_code=status.HTTP_400_BAD_REQUEST)
        else:
            sender = sender.first()

        inbox = Inbox.objects.filter(id=inbox_id)
        if not inbox.exists():
            raise DRFViewException(detail="Inbox does not exist.", status_code=status.HTTP_400_BAD_REQUEST)
        else:
            inbox = inbox.first()

        current_timestamp = int(datetime.now(timezone.utc).timestamp())
        last_message = serializer.validated_data.get("text", "")[: Others.LAST_MESSAGE_LENGTH]
        if len(serializer.validated_data.get("text", "")) > Others.LAST_MESSAGE_LENGTH:
            last_message += "..."

        attachment = serializer.validated_data.get("attachment", None)
        if attachment:
            last_message = "📸 Photo"

        inbox.last_message = last_message
        inbox.last_message_sender = serializer.validated_data.get("sender_id", 0)
        inbox.last_message_timestamp = current_timestamp
        inbox.save(update_fields=["last_message", "last_message_sender", "last_message_timestamp"])

        message = Message.objects.create(
            inbox_id=inbox.id,
            sender_id=serializer.validated_data.get("sender_id", 0),
            text=serializer.validated_data.get("text", ""),
            has_attachment=(serializer.validated_data.get("attachment", None) is not None),
        )

        attachment = serializer.validated_data.get("attachment", None)
        file_url = ""
        if attachment:
            file_url = upload_image_to_cloudinary(attachment)
            if file_url:
                Attachment.objects.create(
                    message_id=message.id,
                    file_name=attachment.name,
                    file_type=attachment.content_type,
                    file_size=attachment.size,
                    file_url=file_url,
                )

        members = InboxMember.objects.filter(inbox_id=inbox_id).only("user_id")
        for member in members:
            message_status = None
            if member.user_id != serializer.validated_data.get("sender_id", 0):
                message_status = MessageStatus.objects.create(
                    message=message,
                    user_id=member.user_id,
                    is_queued=True,
                )
            else:
                continue

            try:
                # Inbox Event for the left side chatbox
                response = trigger_pusher(
                    channels=[f"inbox_{member.user_id}"],
                    event="inbox",
                    data={
                        "inbox_id": inbox.id,
                        "sender_id": serializer.validated_data.get("sender_id", 0),
                        "message": sender.first_name + ": " + last_message,
                        "timestamp": serializer.validated_data.get("timestamp", current_timestamp),
                    },
                )
                if not response:
                    logger.info("Couldn't send inbox event. Received false response from pusher.")
                    return False
                else:
                    logger.info(f"Inbox event sent successfully to channels: {[f'inbox_{member.user_id}']}.")

                # Message Event for the conversations
                response = trigger_pusher(
                    channels=[f"message_{member.user_id}"],
                    event="message",
                    data={
                        "inbox_id": inbox.id,
                        "message_id": message.id,
                        "sender_id": sender.id,
                        "sender_name": sender.username,
                        "sender_status": sender.userinfo.status,
                        "sender_profile_photo": sender.userinfo.profile_photo,
                        "text": serializer.validated_data.get("text", ""),
                        "has_attachment": message.has_attachment,
                        "attachment": file_url,
                        "created_at": message.created_at.isoformat(),
                        "updated_at": message.updated_at.isoformat(),
                    },
                )
                if not response:
                    logger.info("Couldn't send message event. Received false response from pusher.")
                    return False
                else:
                    logger.info(f"Message event sent successfully to channels: {[f'message_{member.user_id}']}.")

                message_status.is_sent = True
                message_status.save(update_fields=["is_sent"])
            except Exception:
                logger.error(
                    {
                        "message": "Couldn't send message via pusher.",
                        "error": convert_exception_string_to_one_line(traceback.format_exc()),
                    }
                )
                message_status.is_failed = True
                message_status.save(update_fields=["is_failed"])
                return False
    except APIException as error:
        raise DRFViewException(detail=error.detail, status_code=status.HTTP_400_BAD_REQUEST)
    except Exception:
        logger.error(
            {
                "message": "Couldn't send message.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        raise DRFViewException(detail="Couldn't send message.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Ending group message sending process....")
    return True


def process_seen_event(data: dict) -> bool:
    user_id = data.get("user_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if not user_id:
        logger.info(f"User id is required for seen event.")
        return False
    MessageStatus.objects.filter(
        message__inbox_id=inbox_id, user_id=user_id, is_seen=False, message__created_at__lte=datetime.now(timezone.utc)
    ).update(is_seen=True)

    logger.info("Successfully processed seen event!!")
    return True


def process_delete_message_event(data: dict) -> bool:
    message_id = data.get("message_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if message_id:
        Message.objects.filter(id=message_id).update(is_deleted=True)
    else:
        Message.objects.filter(inbox_id=inbox_id, is_deleted=False, created_at__lte=datetime.now(timezone.utc)).update(
            is_deleted=True
        )

    logger.info("Successfully processed delete event!!")
    return True


def process_archive_event(data: dict) -> bool:
    user_id = data.get("user_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if not user_id:
        logger.info(f"User Id is required for archive event.")
        return False
    InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id).update(is_archived=True)

    logger.info("Successfully processed archive event!!")
    return True


def process_unarchive_event(data: dict) -> bool:
    user_id = data.get("user_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if not user_id:
        logger.info(f"User Id is required for unarchive event.")
        return False
    InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id).update(is_archived=False)

    logger.info("Successfully processed unarchive event!!")
    return True


def process_mute_event(data: dict) -> bool:
    user_id = data.get("user_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if not user_id:
        logger.info(f"User Id is required for mute event.")
        return False
    InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id).update(is_muted=True)

    logger.info("Successfully processed mute event!!")
    return True


def process_unmute_event(data: dict) -> bool:
    user_id = data.get("user_id", 0)
    inbox_id = data.get("inbox_id", 0)
    if not user_id:
        logger.info(f"User Id is required for unmute event.")
        return False
    InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id).update(is_muted=False)

    logger.info("Successfully processed unmute event!!")
    return True


def process_clear_chat_event(data: dict) -> bool:
    logger.info(f"Starting to clear chat event for data: {data}")

    inbox_id = data.get("inbox_id", 0)
    user_id = data.get("user_id", 0)

    if not inbox_id or not user_id:
        raise DRFViewException(
            detail="Inbox id and user id both are required.", status_code=status.HTTP_400_BAD_REQUEST
        )

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Inbox not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox = inbox.first()
    Attachment.objects.filter(message__inbox_id=inbox_id).delete()
    Message.objects.filter(inbox_id=inbox_id).delete()

    inbox.last_message = ""
    inbox.save(update_fields=["last_message"])

    member_ids = InboxMember.objects.filter(inbox_id=inbox_id).values_list("user_id", flat=True)

    try:
        for member_id in member_ids:
            if member_id == user_id:
                continue
            trigger_pusher(
                [f"inbox_{member_id}", f"message_{member_id}"], InboxEvents.CLEAR_CHAT, {"inbox_id": inbox_id}
            )
            logger.info(f"Successfully sent clear chat event to member id: {member_id} via pusher.")
    except Exception:
        logger.error(
            {
                "message": "Couldn't send clear chat event via pusher.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )

    logger.info(f"Successfully completed clear chat event for data: {data}")
    return True


def process_delete_chat_event(data: dict) -> bool:
    logger.info(f"Starting delete chat event for data: {data}")

    inbox_id = data.get("inbox_id", 0)
    user_id = data.get("user_id", 0)

    if not inbox_id or not user_id:
        raise DRFViewException(
            detail="Inbox id and user id both are required.", status_code=status.HTTP_400_BAD_REQUEST
        )

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Inbox not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox = inbox.first()
    Attachment.objects.filter(message__inbox_id=inbox_id).delete()
    Message.objects.filter(inbox_id=inbox_id).delete()
    member_ids = InboxMember.objects.filter(inbox_id=inbox_id).values_list("user_id", flat=True)

    try:
        for member_id in member_ids:
            if member_id == user_id:
                continue
            trigger_pusher(
                [f"inbox_{member_id}", f"message_{member_id}"], InboxEvents.DELETE_CHAT, {"inbox_id": inbox_id}
            )
            logger.info(f"Successfully sent delete chat event to member id: {member_id} via pusher.")
    except Exception:
        logger.error(
            {
                "message": "Couldn't send delete chat event via pusher.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )

    InboxMember.objects.filter(inbox_id=inbox_id).delete()
    inbox.delete()

    logger.info(f"Successfully completed delete chat event for data: {data}")
    return True


def process_inbox_event(data: dict) -> bool:
    logger.info(f"Starting inbox event process using data: {data} ....")
    try:
        event = data.get("event", "")
        data = data.get("data", {})
        if not data.get("inbox_id", 0):
            logger.info("Inbox id is required for inbox event.")
            return False

        is_success = False
        if event == InboxEvents.SEEN:
            is_success = process_seen_event(data)

        elif event == InboxEvents.DELETE_MESSAGE:
            is_success = process_delete_message_event(data)

        elif event == InboxEvents.CLEAR_CHAT:
            is_success = process_clear_chat_event(data)

        elif event == InboxEvents.DELETE_CHAT:
            is_success = process_delete_chat_event(data)

        elif event == InboxEvents.ARCHIVE:
            is_success = process_archive_event(data)

        elif event == InboxEvents.UNARCHIVE:
            is_success = process_unarchive_event(data)

        elif event == InboxEvents.MUTE:
            is_success = process_mute_event(data)

        elif event == InboxEvents.UNMUTE:
            is_success = process_unmute_event(data)

        else:
            logger.info("Invalid event: ", event)
            return False

    except Exception:
        logger.error(
            {
                "message": "Couldn't handle receive event.",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        return False

    logger.info("Ending inbox event process....")
    return is_success


def get_group_details(inbox_id: int) -> dict:
    logger.info("Starting to get group details for inbox id: ", inbox_id)

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Group not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox = inbox.first()
    inbox_members = InboxMember.objects.filter(inbox_id=inbox_id)
    inbox_data = inbox.__dict__
    inbox_data["group_photo"] = inbox_data.pop("profile_photo")
    members = list()
    for member in inbox_members:
        members.append(
            {
                "user_id": member.user_id,
                "nickname": member.nickname,
                "username": member.user.username,
                "profile_photo": member.user.userinfo.profile_photo,
                "role": member.role,
                "created_at": member.created_at,
                "is_blocked": member.is_blocked,
                "is_archived": member.is_archived,
                "is_muted": member.is_muted,
            }
        )
    inbox_data["inbox_members"] = members
    inbox_data["total_members"] = len(members)

    serializer = GroupDetailsSerializer(data=inbox_data)
    if not serializer.is_valid():
        raise DRFViewException(detail="Something went wrong.", status_code=status.HTTP_400_BAD_REQUEST)

    logger.info("Successfully found group details for inbox id: ", inbox_id)
    return serializer.data


def update_group_details(inbox_id: int, data: dict) -> bool:
    logger.info("Starting to update group details for inbox id: ", inbox_id)

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Group not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox = inbox.first()
    inbox.inbox_name = data.get("inbox_name", inbox.inbox_name)
    if data.get("group_photo", None):
        inbox.profile_photo = upload_image_to_cloudinary(data.get("group_photo"))

    inbox.save(update_fields=["inbox_name", "profile_photo"])

    logger.info("Successfully updated group details for inbox id: ", inbox_id)
    return True


def add_member(inbox_id: int, user_ids: list) -> bool:
    logger.info("Starting to add member to group for inbox id: ", inbox_id)

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Group not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox = inbox.first()
    inbox_members = list()
    for user_id in user_ids:
        user_id = int(user_id)
        user = User.objects.filter(id=user_id)
        if not user.exists():
            raise DRFViewException(detail=f"User with id: {user_id} not found.", status_code=status.HTTP_404_NOT_FOUND)

        inbox_user = InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id)
        if inbox_user.exists():
            raise DRFViewException(
                detail=f"User with id: {user_id} already exists in group.", status_code=status.HTTP_400_BAD_REQUEST
            )

        user = user.first()
        inbox_members.append(InboxMember(inbox=inbox, user_id=user_id, nickname=user.username, role="user"))

    InboxMember.objects.bulk_create(inbox_members)
    logger.info("Successfully added member to group for inbox id: ", inbox_id)
    return True


def exit_group(user_id: int, inbox_id: int) -> bool:
    logger.info(f"Starting to exit group for user id: {user_id} and inbox id: {inbox_id}")

    inbox = Inbox.objects.filter(id=inbox_id)
    if not inbox.exists():
        raise DRFViewException(detail="Group not found.", status_code=status.HTTP_404_NOT_FOUND)

    inbox_user = InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id)
    if not inbox_user.exists():
        raise DRFViewException(
            detail=f"User with id: {user_id} doesn't exist in the group.", status_code=status.HTTP_404_NOT_FOUND
        )

    inbox = inbox.first()
    InboxMember.objects.filter(inbox_id=inbox_id, user_id=user_id).delete()

    logger.info(f"Successfully exited group for user id: {user_id} and inbox id: {inbox_id}")
    return True
