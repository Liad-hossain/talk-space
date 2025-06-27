#!/bin/bash
set -e

if [[ "$SERVICE" == "app" ]]; then
  ./app_entrypoint.sh

elif [[ "$SERVICE" == "redis-listener" ]]; then
  python ./src/manage.py start_redis_inbox_listener

elif [[ "$SERVICE" == "celery-heartbeat" ]]; then
  PYTHONPATH=/app/src celery -A core worker --loglevel=INFO -Q heartbeat --hostname=basic@%h

else
  echo "❌ Unknown SERVICE: $SERVICE"
  exit 1
fi
