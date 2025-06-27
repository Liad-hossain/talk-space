# Backend Description

## Database Design Link

- [Database Design](https://app.diagrams.net/#G1-5Le-wuSjBfM-NZKDfCDQHqMB4pbNhd0#%7B%22pageId%22%3A%22dluyfsjS_Q9gUkw557Xs%22%7D)

## Steps to run project using Docker

- Create a .env file inside backend folder.
- Keep all the required credentials inside .env file. All the required credentials example is given inside .env.example file.
- From the directory backend run command - **docker compose up --build**

## Steps to run project using kubernetes

- Will update later

## Technologies used in this backend service

- django framework
- Pusher
- postgresql
- Redis (As pub/sub, celery broker url and celery result backend)
- Celery
