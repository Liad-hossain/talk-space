#!/bin/bash
set -e

if [[ $SERVICE == "app" ]];
then
  ./entrypoint.sh

elif [[ $SERVICE == "redis-listener" ]];
then
  python ./src/manage.py start_redis_inbox_listener

elif [[ $SERVICE == "celery-heartbeat" ]];
then
  PYTHONPATH=/app/src celery -A core worker --loglevel=INFO -Q heartbeat --hostname=basic@%h
fi
