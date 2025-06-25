const userStates = {
    REGISTER : "register",
    LOGIN : "login",
}

const selectedStates = {
    CHATS: "chats",
    ALL_USERS: "all_users",
    ACTIVE_USERS: "active_users",
    INACTIVE_USERS: "inactive_users",
    GROUPS: "groups",
}

const UserEvents = {
    LOGIN: "login",
    LOGOUT: "logout",
    HEARTBEAT: "heartbeat",
}

const InboxEvents = {
    SEEN: "seen",
    DELETE_MESSAGE: "delete_message",
    DELETE_CHAT: "delete_chat",
    CLEAR_CHAT: "clear_chat",
}


const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT
const TALKSPACE_BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL
const PUSHER_APP_KEY = process.env.REACT_APP_PUSHER_APP_KEY
const PUSHER_APP_CLUSTER = process.env.REACT_APP_PUSHER_APP_CLUSTER


export {userStates, selectedStates, ENVIRONMENT, TALKSPACE_BACKEND_BASE_URL, PUSHER_APP_KEY, PUSHER_APP_CLUSTER, InboxEvents, UserEvents};
