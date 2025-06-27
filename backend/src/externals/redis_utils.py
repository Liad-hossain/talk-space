import redis
import json
import logging
import traceback
from helpers.custom_exception import convert_exception_string_to_one_line
from django.conf import settings


logger = logging.getLogger("stdout")


def get_global_redis():
    return redis.from_url(settings.REDIS_HOST_URL + "0")


def publish_message_to_channel(channel_name: str, message: dict):
    try:
        redis = get_global_redis()
        redis.publish(channel_name, json.dumps(message))
    except Exception:
        logger.error(
            {
                "message": "Couldn't publish event via redis pubsub.",
                "channel_name": channel_name,
                "data": message,
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        return False

    logger.info(f"Message: {message} published to channel: {channel_name} successfully.")
    return True
