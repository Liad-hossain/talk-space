#!/bin/bash
set -e

# Run DB migrations
python ./src/manage.py migrate --noinput

python ./src/manage.py collectstatic --noinput

if [[ "$ENVIRONMENT" == "DEBUG" || "$ENVIRONMENT" == "DEVELOPMENT" ]];
then
    python ./src/manage.py runserver 0.0.0.0:8000

elif [["$ENVIRONMENT" == "PRODUCTION" ]];
then
    (gunicorn core.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --chdir src --bind 0.0.0.0:8000 --access-logfile - --error-logfile -)

else
    (gunicorn core.asgi:application -w 3 -k uvicorn.workers.UvicornWorker --chdir src --bind 0.0.0.0:8000 --access-logfile - --error-logfile -)

fi

# Run the Django server
exec "$@"
