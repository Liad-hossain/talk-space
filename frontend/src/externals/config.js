import { TALKSPACE_BACKEND_BASE_URL } from "../const"

const config = {
    auth: {
        register: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/register`,
        login: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/login`,
        logout: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/logout`,
    },
    chat: {
        get_conversations: (id) => `${TALKSPACE_BACKEND_BASE_URL}/api/chat/${id}/get-conversations`,
        send_message: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/chat/${user_id}/send-message`,
    }
}

export default config;
