const userStates = {
    REGISTER : "register",
    LOGIN : "login",
}

const chatStates = {
    NOT_SELECTED: "not_selected",
    SELECTED: 'selected'
}

const contentSources = {
    ADMIN: "admin",
    FRIEND: "friend"
}

const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT
const TALKSPACE_BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL
const PUSHER_APP_KEY = process.env.REACT_APP_PUSHER_APP_KEY
const PUSHER_APP_CLUSTER = process.env.REACT_APP_PUSHER_APP_CLUSTER


export {userStates, chatStates, ENVIRONMENT, TALKSPACE_BACKEND_BASE_URL, contentSources, PUSHER_APP_KEY, PUSHER_APP_CLUSTER};
