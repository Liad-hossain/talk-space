import logging
import traceback
from .models import Inbox, Message, InboxMember, MessageStatus, Attachment
from accounts.models import User
from .serializers import MessageSerializer, ChatSerializer, ConversationSerializer, UserSerializer, GroupSerializer
from helpers.custom_exception import DRFViewException, convert_exception_string_to_one_line
from rest_framework import status
from django.db.models import Q, F, Count, OuterRef, Subquery, IntegerField, QuerySet
from externals.pusher import trigger_pusher
from helpers.const import UserStatus
from datetime import datetime, timezone


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
            .annotate(count=Count("id"))
            .values("count")
        )

        inboxes = (
            Inbox.objects.filter(
                inboxmember__user_id=user_id,
            )
            .annotate(unseen_count=Subquery(unseen_count, output_field=IntegerField()))
            .order_by("-last_message_timestamp")[offset : offset + limit]
        )

        for inbox in inboxes:
            inbox_members = InboxMember.objects.filter(
                inbox_id=inbox.id,
            )

            members = list()
            for member in inbox_members:
                members.append(
                    {
                        "user_id": member.user_id,
                        "role": member.role,
                        "is_blocked": member.is_blocked,
                    }
                )

            inbox_data = inbox.__dict__
            inbox_data["inbox_id"] = inbox_data.pop("id")
            inbox_data["members"] = members
            print(inbox_data)
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
        messages = Message.objects.filter(inbox_id=inbox_id,).order_by(
            "-created_at"
        )[offset : offset + limit]

        for message in messages:
            attachments = list()
            if message.has_attachment:
                attachments = list(
                    Attachment.objects.filter(message_id=message.id,).values(
                        "file_name",
                        "file_type",
                        "file_url",
                        "is_deleted",
                    )
                )

            conversation_data = message.__dict__
            conversation_data["message_id"] = conversation_data.pop("id")
            conversation_data["attachments"] = attachments
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
        users_qs = (
            User.objects.filter(query)
            .annotate(
                profile_photo=F("userinfo__profile_photo"),
                status=F("userinfo__status"),
            )
            .values("id", "username", "profile_photo", "status")
            .order_by("-userinfo__created_at")[offset : offset + limit]
        )

        for user in users_qs:
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
    except Exception as e:
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
        groups_qs = (
            Inbox.objects.filter(
                inboxmember__user_id=user_id,
                is_group=True,
            )
            .only("id", "group_name")
            .order_by("-last_message_timestamp")[offset : offset + limit]
        )

        for group in groups_qs:
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


def send_message(receiver_id: int, data: dict, **kwargs) -> bool:
    logger.info("Starting send message process....")
    try:
        serializer = MessageSerializer(data=data)
        if not serializer.is_valid():
            message = "Could not validate the data provided by the user for sending message."
            logger.error(msg={"message": message, "error": serializer.errors})
            raise DRFViewException(
                detail="The data provided is not valid.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        sender = User.objects.filter(id=serializer.validated_data.get("sender_id", 0)).first()
        if not sender:
            raise DRFViewException(detail="Sender does not exist.", status_code=status.HTTP_400_BAD_REQUEST)

        receiver = User.objects.filter(id=receiver_id).first()
        if not receiver:
            raise DRFViewException(detail="Receiver does not exist.", status_code=status.HTTP_400_BAD_REQUEST)

        current_timestamp = int(datetime.now(timezone.utc).timestamp())
        inbox = (
            Inbox.objects.filter(
                inboxmember__user_id__in=[serializer.validated_data.get("sender_id", 0), receiver_id],
            )
            .only(
                "id",
            )
            .annotate(user_count=Count("inboxmember__user_id"))
            .filter(user_count=2)
        )

        last_message = serializer.validated_data.get("text", "")[:20]
        if last_message:
            last_message += "..."

        if not inbox.exists():
            inbox = Inbox.objects.create(
                group_name="",
                is_group=False,
                is_archived=False,
                is_muted=False,
                last_message=last_message,
                last_message_sender=serializer.validated_data.get("sender_id", 0),
                last_message_timestamp=current_timestamp,
            )
            InboxMember.objects.create(
                inbox=inbox,
                user_id=serializer.validated_data.get("sender_id", 0),
                role="user",
            )
            InboxMember.objects.create(
                inbox=inbox,
                user_id=receiver_id,
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
            has_attachment=(len(serializer.validated_data.get("attachments", [])) > 0),
        )

        message_status = MessageStatus.objects.create(
            message=message,
            user_id=receiver_id,
            is_queued=True,
        )

        try:
            response = trigger_pusher(
                channels=[f"user_{receiver_id}"],
                event="message",
                data={
                    "inbox_id": inbox.first().id if isinstance(inbox, QuerySet) else inbox.id,
                    "message_id": message.id,
                    "last_message": last_message,
                    "timestamp": serializer.validated_data.get("timestamp", current_timestamp),
                },
            )

            print("Data: ", data)
            if not response:
                logger.info("Couldn't send message. Received false response from pusher.")
                return False
        except Exception:
            logger.error(
                {
                    "message": "Couldn't send message via pusher.",
                    "error": convert_exception_string_to_one_line(traceback.format_exc()),
                }
            )
            message_status.is_failed = True
            message_status.save()
            return False
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
