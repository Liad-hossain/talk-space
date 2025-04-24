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

const TALKSPACE_BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL

export {userStates, chatStates, TALKSPACE_BACKEND_BASE_URL, contentSources};
