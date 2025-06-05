import logging
import traceback
from .models import Inbox, Message, InboxMember, MessageStatus, Attachment
from accounts.models import User
from .serializers import MessageSerializer, ChatSerializer, ConversationSerializer, UserSerializer, GroupSerializer
from helpers.custom_exception import DRFViewException, convert_exception_string_to_one_line
from rest_framework import status
from django.db.models import Q, F, Count, OuterRef, Subquery, IntegerField, QuerySet
from externals.pusher import trigger_pusher
from helpers.const import UserStatus, InboxEvents
from datetime import datetime, timezone
from rest_framework.exceptions import APIException


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

            receiver_id = None
            members = list()
            for member in inbox_members:
                members.append(
                    {
                        "user_id": member.user_id,
                        "role": member.role,
                        "is_blocked": member.is_blocked,
                        "is_archived": member.is_archived,
                        "is_muted": member.is_muted,
                    }
                )
                if member.user_id != user_id:
                    receiver_id = member.user_id
            inbox_data = inbox.__dict__
            inbox_data["inbox_id"] = inbox_data.pop("id")
            inbox_data["inbox_members"] = members
            inbox_data["unseen_count"] = inbox_data["unseen_count"] if inbox_data["unseen_count"] else 0

            if not inbox.is_group and receiver_id:
                user = User.objects.filter(id=receiver_id).only("id", "username").first()
                if user:
                    inbox_data["inbox_name"] = user.username
                    inbox_data["is_active"] = user.userinfo.status == UserStatus.ACTIVE
                    inbox_data["last_active_time"] = user.userinfo.last_active_time
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
        users_qs = (
            User.objects.filter(query)
            .annotate(
                profile_photo=F("userinfo__profile_photo"),
                status=F("userinfo__status"),
                last_active_time=F("userinfo__last_active_time"),
            )
            .values("id", "username", "profile_photo", "status", "last_active_time")
            .order_by("-userinfo__created_at")[offset : offset + limit]
        )

        for user in users_qs:
            inbox = (
                Inbox.objects.filter(
                    inboxmember__user_id__in=[user_id, user["id"]],
                )
                .only(
                    "id",
                )
                .annotate(user_count=Count("inboxmember__user_id"))
                .filter(user_count=2)
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
                            "role": member.role,
                            "is_blocked": member.is_blocked,
                        }
                    )
            else:
                members.append(
                    {
                        "user_id": user["id"],
                        "role": "user",
                        "is_blocked": False,
                    }
                )

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
        groups_qs = (
            Inbox.objects.filter(
                inboxmember__user_id=user_id,
                is_group=True,
            )
            .only("id", "inbox_name")
            .order_by("-last_message_timestamp")[offset : offset + limit]
        )

        for group in groups_qs:
            inbox_members = InboxMember.objects.filter(
                inbox_id=group.id,
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

            group_data = group.__dict__
            group_data["inbox_id"] = group_data.pop("id")
            group_data["inbox_members"] = members
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
        if len(serializer.validated_data.get("text", "")) > 20:
            last_message += "..."

        if not inbox.exists():
            inbox = Inbox.objects.create(
                inbox_name="",
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
            # Inbox Event for the left side chatbox
            response = trigger_pusher(
                channels=[f"inbox_{receiver_id}"],
                event="inbox",
                data={
                    "inbox_id": inbox.first().id if isinstance(inbox, QuerySet) else inbox.id,
                    "sender_id": serializer.validated_data.get("sender_id", 0),
                    "message": last_message,
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
                    "sender_id": serializer.validated_data.get("sender_id", 0),
                    "text": serializer.validated_data.get("text", ""),
                    "has_attachment": message.has_attachment,
                    "attachments": [],
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
            message_status.save()
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


def process_delete_event(data: dict) -> bool:
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

        elif event == InboxEvents.DELETE:
            is_success = process_delete_event(data)

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
