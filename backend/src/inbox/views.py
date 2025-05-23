import logging
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import QueryParamSerializer
from .services import get_chats, get_conversations, get_users, get_groups, send_message


logger = logging.getLogger("stdout")


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_chats_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get chats view.")
    serializer = QueryParamSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(data={"success": False, "message": serializer.errors}, status=400)

    data = get_chats(user_id=kwargs.get("user_id"), **serializer.data)
    return Response(data={"success": True, "dataSource": data}, status=200)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_conversations_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get conversations view.")
    serializer = QueryParamSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(data={"success": False, "message": serializer.errors}, status=400)

    data = get_conversations(inbox_id=kwargs.get("inbox_id"), **serializer.data)
    return Response(data={"success": True, "dataSource": data}, status=200)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_users_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get users view.")
    serializer = QueryParamSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(data={"success": False, "message": serializer.errors}, status=400)

    data = get_users(user_id=kwargs.get("user_id"), **serializer.data)
    return Response(data={"success": True, "dataSource": data}, status=200)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_groups_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered get groups view.")
    serializer = QueryParamSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(data={"success": False, "message": serializer.errors}, status=400)

    data = get_groups(user_id=kwargs.get("user_id"), **serializer.data)
    return Response(data={"success": True, "dataSource": data}, status=200)


@api_view(["POST"])
@permission_classes((IsAuthenticated,))
def send_message_view(request: Request, *args, **kwargs) -> Response:
    logger.info("Entered send message view.")
    data = send_message(receiver_id=kwargs.get("receiver_id"), data=request.data)
    return Response(data={"success": True, "dataSource": data}, status=200)
