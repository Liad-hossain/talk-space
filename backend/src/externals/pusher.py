import logging
import traceback
import json
from django.conf import settings
from pusher import pusher
from decouple import config
from typing import Union, List, Optional
from helpers.custom_exception import convert_exception_string_to_one_line


logger = logging.getLogger("stdout")

PUSHER_APP_ID = config("PUSHER_APP_ID", default="PUSHER_APP_ID")
PUSHER_APP_KEY = config("PUSHER_APP_KEY", default="PUSHER_APP_KEY")
PUSHER_APP_SECRET = config("PUSHER_APP_SECRET", default="PUSHER_APP_SECRET")
PUSHER_APP_CLUSTER = config("PUSHER_APP_CLUSTER", default="PUSHER_APP_CLUSTER")

PUSHER_APP: Optional[pusher.Pusher] = None
PUSHER_ENABLED_ENVIRONMENTS = ["LIVE", "STAGE"]


def get_pusher_app():
    global PUSHER_APP
    if not PUSHER_APP and settings.ENVIRONMENT in PUSHER_ENABLED_ENVIRONMENTS:
        try:
            logger.info("Entering to create pusher app instance.")
            PUSHER_APP = pusher.Pusher(
                app_id=PUSHER_APP_ID,
                key=PUSHER_APP_KEY,
                secret=PUSHER_APP_SECRET,
                cluster=PUSHER_APP_CLUSTER,
                ssl=True,
            )
            logger.info("Pusher app created successfully.")
        except Exception:
            logger.warning("Failed to create pusher app.")
            PUSHER_APP = None

    logger.info("Created Pusher App: ", PUSHER_APP)
    return PUSHER_APP


def trigger_pusher(channels: Union[str, List[str]], event: str, data: dict) -> bool:
    if not channels:
        return False

    try:
        get_pusher_app()
        if not PUSHER_APP:
            return False
        PUSHER_APP.trigger(channels, event, data)
        logger.info("Pusher triggered successfully.")
        return True
    except Exception as e:
        logger.error(
            {
                "message": "Couldn't send data via pusher.",
                "channels": channels,
                "event": event,
                "data": {json.dumps(data)},
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        return False
