import logging
from accounts.serializers import RegisterSerializer, UserSerializer, LoginSerializer
from rest_framework import status
from accounts.models import User, UserInfo
from accounts.helpers import is_strong_password
from helpers.custom_exception import DRFViewException
from django.utils import timezone

logger = logging.getLogger("stdout")


def register(body: dict) -> dict:
    logger.info("Starting registration process....")
    serializer = RegisterSerializer(data=body)
    if not serializer.is_valid():
        message = f"Could not validate the data provided by the user for registration."
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

    user = User.objects.create_user(
        username=serializer.validated_data.get("username", ""),
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

    user.userinfo.status = "active"
    user.userinfo.save(update_fields=["status"])
    refresh = serializer.get_token(serializer.user)
    logger.info("Login process completed successfull!!!")

    return {
        "id": user.id,
        "username": user.userinfo.username,
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
    }


def logout(user: User, refresh_token: str) -> dict:
    logger.info("Starting Logout process....")

    user.userinfo.status = "inactive"
    user.userinfo.last_active_time = timezone.now()
    user.userinfo.save(update_fields=["status", "last_active_time"])

    logger.info("Logout process completed successfull!!!")
    return "Logged out successfully."
