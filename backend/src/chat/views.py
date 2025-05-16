import logging
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .services import send_message, get_conversations


logger = logging.getLogger("stdout")


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_conversations_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get conversations view.")
    data = get_conversations(user_id=kwargs.get("user_id"))
    return Response(data={"success": True, "data": data}, status=200)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def send_message_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered send message view.")
    body = request.data
    data = send_message(id=kwargs.get("id"), data=body)
    return Response(data={"success": True, "data": data}, status=200)
