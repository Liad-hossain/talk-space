import { TALKSPACE_BACKEND_BASE_URL } from "../const"

const config = {
    auth: {
        register: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/register`,
        login: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/login`,
        logout: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/logout`,
        refresh: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/refresh`,
    },
    inbox: {
        get_chats: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/chats`,
        get_conversations: (inbox_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${inbox_id}/conversations`,
        get_users: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/users`,
        get_groups: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/groups`,
        send_message: (receiver_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${receiver_id}/send-message`,
    }
}

export default config;
