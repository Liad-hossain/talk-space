#!/bin/bash
set -e

# Run DB migrations
python ./src/manage.py migrate --noinput --verbosity 3

python ./src/manage.py collectstatic --noinput --clear


if [[ $CREATE_SUPERUSER ]];
then
  python ./src/manage.py createsuperuser --no-input
fi

if [[ "$ENVIRONMENT" == "DEBUG" || "$ENVIRONMENT" == "DEVELOPMENT" ]];
then
    python ./src/manage.py runserver 0.0.0.0:"$PORT"

elif [[ "$ENVIRONMENT" == "LIVE" ]];
then
    (gunicorn core.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --chdir src --bind 0.0.0.0:"$PORT" --access-logfile - --error-logfile -)

else
    (gunicorn core.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --chdir src --bind 0.0.0.0:"$PORT" --access-logfile - --error-logfile -)

fi

# Run the Django server
exec "$@"
