import logging
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from django_ratelimit.decorators import ratelimit
from blacklist.ratelimit import blacklist_ratelimited
from datetime import timedelta


from accounts.services import register, login, logout

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
    return Response({"success": True, "data": data}, status=200)


@api_view(["POST"])
@permission_classes((AllowAny,))
@ratelimit(key="user_or_ip", rate="15/m", block=False)
@blacklist_ratelimited(timedelta(minutes=10))
def login_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered login view.")
    body = request.data
    data = login(body)
    return Response({"success": True, "data": data}, status=200)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def logout_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered logout view.")
    user = request.user
    refresh_token = request.data.get("refresh_token", "")
    return Response({"success": True, "data": logout(user, refresh_token)}, status=200)
