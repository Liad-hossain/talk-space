import logging
from externals.pusher import trigger_pusher

logger = logging.getLogger("stdout")


def get_conversations(user_id: int):
    logger.info("Starting get conversations process....")
    return [
        {"id": 1, "name": "John Doe", "text": "Hello", "last_send_time": "10:30 pm", "unread_text_count": "2"},
        {"id": 2, "name": "Alice", "text": "Good Morning", "last_send_time": "06:00 am", "unread_text_count": "1"},
        {"id": 3, "name": "Bob", "text": "Good night", "last_send_time": "12:00 pm", "unread_text_count": "3"},
        {"id": 4, "name": "John Doe", "text": "Hello", "last_send_time": "10:30 pm", "unread_text_count": "2"},
        {"id": 5, "name": "Alice", "text": "Good Morning", "last_send_time": "06:00 am", "unread_text_count": "1"},
        {"id": 6, "name": "Bob", "text": "Good night", "last_send_time": "12:00 pm", "unread_text_count": "3"},
        {"id": 7, "name": "John Doe", "text": "Hello", "last_send_time": "10:30 pm", "unread_text_count": "2"},
        {"id": 8, "name": "Alice", "text": "Good Morning", "last_send_time": "06:00 am", "unread_text_count": "1"},
        {"id": 9, "text": "Good night", "name": "Bob", "last_send_time": "12:00 pm", "unread_text_count": "3"},
        {"id": 10, "name": "John Doe", "text": "Hello", "last_send_time": "10:30 pm", "unread_text_count": "2"},
        {"id": 11, "name": "Bob", "text": "Good night", "last_send_time": "12:00 pm", "unread_text_count": "3"},
        {"id": 12, "name": "John Doe", "text": "Hello", "last_send_time": "10:30 pm", "unread_text_count": "2"},
    ]


def send_message(id: int, data: dict) -> None:
    logger.info("Starting send message process....")
    try:
        response = trigger_pusher(channels=f"User-{id}", event="message", data=data)
        if response:
            logger.info(f"Message sent successfully for data: {data}.")
        else:
            logger.error(f"Message sending failed for data: {data}.")
    except Exception as e:
        logger.error(
            {
                "message": "Couldn't send data via pusher.",
                "error": str(e),
            }
        )
