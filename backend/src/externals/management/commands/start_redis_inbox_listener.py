import redis
import json
import threading
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from helpers.const import RedisChannelNames
from accounts.services import process_user_event
from inbox.services import process_inbox_event

logger = logging.getLogger("stdout")


class Command(BaseCommand):
    def __init__(self):
        super().__init__()
        self.redis_client = None

    def handle(self, *args, **options):
        self.redis_client = redis.from_url(settings.REDIS_HOST_URL)

        # Starting redis pubsub listener in a separate thread
        listener_thread = threading.Thread(
            target=self.redis_pubsub_listener,
        )

        listener_thread.daemon = True
        listener_thread.start()

        logger.info("Redis pubsub listener started successfully!")

        try:
            listener_thread.join()
        except KeyboardInterrupt:
            self.stdout.write("Stopping redis pubsub listener...")

    def redis_pubsub_listener(self):
        pubsub = self.redis_client.pubsub()

        for key, channel in RedisChannelNames.__dict__.items():
            if isinstance(channel, str) and key != "__module__":
                pubsub.subscribe(channel)
                logger.info(f"Redis channel name: {channel} subscribed successfully.")

        for message in pubsub.listen():
            if message["type"] == "message":
                self.process(message)

    def process(self, message):
        """
        Message format:
          {
              "channel": "inbox_event",
              "data": {
                  "event_type": "",
                  "data": {}
              }
          }
        """
        logger.info("Received Message: ", message)
        data = json.loads(message.get("data"))
        if message.get("channel") == RedisChannelNames.INBOX_EVENT:
            process_inbox_event(data)
        elif message.get("channel") == RedisChannelNames.USER_EVENT:
            process_user_event(data)
        else:
            logger.info("Invalid channel name: ", message.get("channel"))
