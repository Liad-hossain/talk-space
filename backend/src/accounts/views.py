import logging
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework import serializers

from django_ratelimit.decorators import ratelimit
from blacklist.ratelimit import blacklist_ratelimited
from datetime import timedelta
from rest_framework_simplejwt.views import TokenRefreshView
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, inline_serializer

from accounts.services import register, login, logout, get_profile, update_profile
from externals.redis_utils import publish_message_to_channel
from helpers.const import RedisChannelNames

logger = logging.getLogger("stdout")


@api_view(["GET"])
@permission_classes((AllowAny,))
def check_health_view(request: Request) -> Response:
    logger.info("Entered health check view.")
    message = "The service is healthy."
    return Response(data={"success": True, "message": message}, status=200)


@api_view(["POST"])
@permission_classes((AllowAny,))
def register_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered register view.")
    body = request.data
    data = register(body)
    return Response({"success": True, "dataSource": data}, status=200)


@api_view(["POST"])
@permission_classes((AllowAny,))
@ratelimit(key="user_or_ip", rate="15/m", block=False)
@blacklist_ratelimited(timedelta(minutes=10))
def login_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered login view.")
    body = request.data
    data = login(body)
    return Response({"success": True, "dataSource": data}, status=200)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def logout_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered logout view.")
    user = request.user
    return Response({"success": True, "dataSource": logout(user)}, status=200)


class CustomTokenRefreshView(TokenRefreshView):
    @extend_schema(
        operation_id="accounts/refresh",
        request={"application/json": TokenRefreshSerializer},
        responses={
            200: inline_serializer(
                "Refresh",
                fields={"access": serializers.CharField()},
            )
        },
    )
    @method_decorator(ratelimit(key="user_or_ip", rate="15/m", block=False))
    @method_decorator(blacklist_ratelimited(timedelta(days=1)))
    def post(self, request: Request, *args, **kwargs) -> Response:
        response = super().post(request, *args, **kwargs)
        return response


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def publish_user_event_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered publish user event view.")
    message = request.data
    message["channel"] = RedisChannelNames.USER_EVENT
    is_success = publish_message_to_channel(channel_name=RedisChannelNames.USER_EVENT, message=message)
    if is_success:
        logger.info("User event published successfully.")

    return Response(data={"success": is_success}, status=200)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_profile_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get profile photo view.")
    data = get_profile(user_id=kwargs.get("user_id"))
    return Response(data={"success": True, "dataSource": data}, status=200)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def update_profile_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered update profile photo view.")
    file_keys = [key for key, value in request.data.items() if hasattr(value, "read")]
    for key in file_keys:
        request.data.pop(key)

    is_success = update_profile(
        user_id=kwargs.get("user_id"), data=request.data, file_obj=request.FILES.get("file", None)
    )
    return Response(data={"success": is_success}, status=200)
