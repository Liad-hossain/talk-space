class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"
    DELETED = "deleted"


class InboxEvents:
    SEEN = "seen"
    DELETE = "delete"
    MUTE = "mute"
    UNMUTE = "unmute"
    ARCHIVE = "archive"
    UNARCHIVE = "unarchive"


class UserEvents:
    LOGIN = "login"
    LOGOUT = "logout"
    HEARTBEAT = "heartbeat"


class RedisChannelNames:
    INBOX_EVENT = "inbox_event"
    USER_EVENT = "user_event"
