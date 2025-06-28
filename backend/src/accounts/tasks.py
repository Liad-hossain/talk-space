import logging
import traceback
import requests
from django.utils import timezone
from celery import shared_task
from django.contrib.auth.models import User
from helpers.custom_exception import convert_exception_string_to_one_line
from decouple import config
from core.celery import app


logger = logging.getLogger("stdout")


TALK_SPACE_BASE_URL = config("TALK_SPACE_BASE_URL", default="http://localhost:8000")


@app.task(ignore_result=True, time_limit=30)
def task_update_user_last_active_time(user_id):
    logger.info(f"Starting to update user last active time for user id: {user_id}")

    user = User.objects.filter(id=user_id)
    if not user.exists():
        logger.error(
            {
                "message": f"User does not exist for user id: {user_id}",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        return

    try:
        user = user.first()
        seconds_ago = (timezone.now() - user.userinfo.last_active_time).total_seconds()

        if seconds_ago < 60:
            logger.info(f"User last_active_time is less than 1 minute for user id: {user_id}. So skipping the update.")
            return

        user.userinfo.status = "inactive"
        user.userinfo.save(update_fields=["status"])
        logger.info(f"User active status updated to inactive successfully for user id: {user_id}")
    except Exception:
        logger.error(
            {
                "message": f"Error occurred while updating user last active time for user id: {user_id}",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )


@shared_task(ignore_result=True, time_limit=30)
def task_trigger_health_check():
    logger.info("Entered health check task.")
    try:
        response = requests.get(f"{TALK_SPACE_BASE_URL}/api/accounts/check-health")
        if response.status_code == 200:
            logger.info("The service is found healthy.")
        else:
            logger.error("The service is not found healthy. There might be a problem.")
    except Exception:
        logger.error(
            {
                "message": f"Error occurred while triggering health check",
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
