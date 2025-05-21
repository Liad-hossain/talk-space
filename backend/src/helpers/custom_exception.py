from rest_framework.exceptions import APIException
from rest_framework import status


class DRFViewException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Something Unexpected Happened."
    default_code = "invalid"

    def __init__(
        self,
        detail: str = None,
        status_code: int = None,
        error_code: str = None,
    ):
        if detail is None:
            detail = self.default_detail
        if status_code is not None:
            self.status_code = status_code
        if error_code is None:
            error_code = self.default_code

        self.detail = {"error": detail, "code": error_code, "success": False}


def convert_exception_string_to_one_line(e: str) -> str:
    return str(e).replace("\n", " ").replace('"', "'")
