#!/bin/bash
set -e

echo "Starting service: $SERVICE"

if [[ "$SERVICE" == "app" ]]; then
  /app/app_entrypoint.sh

elif [[ "$SERVICE" == "redis-listener" ]]; then
  python ./src/manage.py start_redis_inbox_listener
  exec python -m http.server "$PORT"

elif [[ "$SERVICE" == "celery-heartbeat" ]]; then
  PYTHONPATH=/app/src celery -A core worker --loglevel=INFO -Q heartbeat --hostname=basic@%h
  exec python -m http.server "$PORT"

else
  echo "❌ Unknown SERVICE: $SERVICE"
  exit 1
fi
