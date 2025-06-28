class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    DELETED = "deleted"


class InboxEvents:
    SEEN = "seen"
    DELETE_MESSAGE = "delete_message"
    DELETE_CHAT = "delete_chat"
    CLEAR_CHAT = "clear_chat"
    MUTE = "mute"
    UNMUTE = "unmute"
    ARCHIVE = "archive"
    UNARCHIVE = "unarchive"


class UserEvents:
    LOGIN = "login"
    LOGOUT = "logout"
    HEARTBEAT = "heartbeat"
    CHECK_HEALTH = "check_health"


class RedisChannelNames:
    INBOX_EVENT = "inbox_event"
    USER_EVENT = "user_event"


class Others:
    LAST_MESSAGE_LENGTH = 15
