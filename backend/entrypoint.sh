#!/bin/bash
set -e

echo "Starting service: $SERVICE"

python ./src/manage.py start_redis_inbox_listener &

PYTHONPATH=/app/src celery -A core worker --loglevel=INFO -Q heartbeat --hostname=basic@%h &

/app/app_entrypoint.sh
