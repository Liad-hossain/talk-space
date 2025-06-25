import logging
from accounts.serializers import RegisterSerializer, UserSerializer, LoginSerializer
from rest_framework import status
from accounts.models import User, UserInfo
from accounts.helpers import is_strong_password
from helpers.custom_exception import DRFViewException
from django.utils import timezone
from helpers.const import UserEvents, RedisChannelNames
from externals.redis_utils import publish_message_to_channel
from datetime import datetime, timedelta
from helpers.utils import upload_image_to_cloudinary
from .tasks import task_update_user_last_active_time
from django.conf import settings


logger = logging.getLogger("stdout")


def register(body: dict) -> dict:
    logger.info("Starting registration process....")
    serializer = RegisterSerializer(data=body)
    if not serializer.is_valid():
        message = f"Invalid Registration Form provided."
        logger.error(msg={"message": message, "error": serializer.errors})
        raise DRFViewException(detail=message, status_code=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=serializer.validated_data["email"]).exists():
        raise DRFViewException(detail="A user with this email already exists.", status_code=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=serializer.validated_data["username"]).exists():
        raise DRFViewException(
            detail="A user with this username already exists.", status_code=status.HTTP_400_BAD_REQUEST
        )

    is_strong, message = is_strong_password(serializer.validated_data["password"])
    if not is_strong:
        raise DRFViewException(detail=message, status_code=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data.get("username", "")
    parts = username.strip().split()
    first_name, last_name = parts[0], ("" if len(parts) == 1 else " ".join(parts[1:]))
    user = User.objects.create_user(
        username=username,
        first_name=first_name,
        last_name=last_name,
        email=serializer.validated_data.get("email", ""),
        password=serializer.validated_data.get("password", ""),
    )

    _ = UserInfo.objects.create(
        user=user,
        username=serializer.validated_data.get("username", ""),
        email=serializer.validated_data.get("email", ""),
        city=serializer.validated_data.get("city", ""),
        country=serializer.validated_data.get("country", ""),
    )

    logger.info("User registration process completed successfull!!!")
    return UserSerializer(user).data


def login(body: dict) -> dict:
    logger.info("Starting login process....")
    username = body.get("username", "")

    user = User.objects.filter(username=username).first()
    if not user:
        raise DRFViewException(detail="User does not exist.", status_code=status.HTTP_400_BAD_REQUEST)

    serializer = LoginSerializer(data=body)
    if not serializer.is_valid():
        raise DRFViewException(
            detail="The password doesn't match.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="invalid_password",
        )

    publish_message_to_channel(
        channel_name=RedisChannelNames.USER_EVENT,
        message={
            "event": UserEvents.LOGIN,
            "data": {"user_id": user.id, "last_active_time": timezone.now().isoformat()},
        },
    )
    refresh = serializer.get_token(serializer.user)
    logger.info("Login process completed successfull!!!")

    return {
        "id": user.id,
        "username": user.userinfo.username,
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
    }


def logout(user: User) -> dict:
    logger.info("Starting Logout process....")

    publish_message_to_channel(
        channel_name=RedisChannelNames.USER_EVENT,
        message={
            "event": UserEvents.LOGOUT,
            "data": {"user_id": user.id, "last_active_time": timezone.now().isoformat()},
        },
    )
    logger.info("Logout process completed successfull!!!")

    return "Logged out successfully."


def connect_user(data: dict):
    user_id = data.get("user_id", 0)
    user = User.objects.filter(id=user_id)
    last_active_time = data.get("last_active_time", "")
    if user.exists() and last_active_time:
        last_active_time = datetime.fromisoformat(last_active_time)
        user = user.first()
        user.userinfo.status = "active"
        user.userinfo.save(update_fields=["status", "last_active_time"])
        return True
    return False


def disconnect_user(data: dict):
    user_id = data.get("user_id", 0)
    last_active_time = data.get("last_active_time", "")
    print("last_active_time: ", last_active_time)

    user = User.objects.filter(id=user_id)
    if user.exists() and last_active_time:
        last_active_time = datetime.fromisoformat(last_active_time)
        user = user.first()
        user.userinfo.status = "inactive"
        user.userinfo.last_active_time = last_active_time
        user.userinfo.save(update_fields=["status", "last_active_time"])
        return True
    return False


def process_user_heartbeat(data: dict):
    user_id = data.get("user_id", 0)
    user = User.objects.filter(id=user_id)
    if not user.exists():
        raise DRFViewException(
            detail=f"No user found for the given user_id: {user_id}.", status_code=status.HTTP_400_BAD_REQUEST
        )
    user = user.first()
    user.userinfo.status = "active"
    user.userinfo.last_active_time = timezone.now()
    user.userinfo.save(update_fields=["status", "last_active_time"])

    if settings.USE_CELERY:
        task_update_user_last_active_time.apply_async(
            queue="heartbeat",
            routing_key="heartbeat",
            kwargs={"user_id": user_id},
            eta=datetime.utcnow() + timedelta(minutes=2),
        )
    else:
        task_update_user_last_active_time(user_id=user_id)

    return True


def process_user_event(message: dict):
    logger.info(f"Receivend user event message: {message} for event: {message.get('event')}")

    event = message.get("event")
    data = message.get("data", {})
    is_success = False
    if event == UserEvents.LOGIN:
        is_success = connect_user(data)

    elif event == UserEvents.LOGOUT:
        is_success = disconnect_user(data)

    elif event == UserEvents.HEARTBEAT:
        is_success = process_user_heartbeat(data)

    if is_success:
        logger.info(f"User event process for event: {event} is completed successfully!!!")
    return is_success


def get_profile(user_id: int) -> dict:
    user = User.objects.filter(id=user_id)
    if not user.exists():
        raise DRFViewException(detail="User does not exist.", status_code=status.HTTP_400_BAD_REQUEST)

    return UserSerializer(user.first()).data


def update_profile(user_id: int, data: dict = dict(), file_obj=None) -> bool:
    user = User.objects.filter(id=user_id).first()
    if not user:
        raise DRFViewException(detail="User does not exist.", status_code=status.HTTP_400_BAD_REQUEST)

    is_success = True
    if file_obj:
        file_url = upload_image_to_cloudinary(file_obj)

        if file_url:
            user.userinfo.profile_photo = file_url
            user.userinfo.save(update_fields=["profile_photo"])
        else:
            is_success = False

    if data:
        user.username = data.get("username", user.username)
        user.userinfo.username = user.username
        parts = user.username.strip().split()
        user.first_name, user.last_name = parts[0], ("" if len(parts) == 1 else " ".join(parts[1:]))
        user.email = data.get("email", user.userinfo.email)
        user.userinfo.email = user.email
        user.userinfo.phone_number = data.get("phone_number", user.userinfo.phone_number)
        user.userinfo.city = data.get("city", user.userinfo.city)
        user.userinfo.country = data.get("country", user.userinfo.country)
        user.userinfo.save(
            update_fields=[
                "username",
                "email",
                "phone_number",
                "city",
                "country",
            ]
        )
        user.save(
            update_fields=[
                "username",
                "first_name",
                "last_name",
                "email",
            ]
        )

    return is_success
