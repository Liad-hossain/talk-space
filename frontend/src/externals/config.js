import { TALKSPACE_BACKEND_BASE_URL } from "../const"

const config = {
    auth: {
        register: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/register`,
        login: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/login`,
        logout: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/logout`,
        refresh: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/refresh`,
        publish_event: () => `${TALKSPACE_BACKEND_BASE_URL}/api/accounts/publish-event`,
    },
    inbox: {
        get_chats: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/chats`,
        get_conversations: (inbox_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${inbox_id}/conversations`,
        get_users: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/users`,
        get_groups: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/groups`,
        create_group: (user_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${user_id}/create-group`,
        send_message: (receiver_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${receiver_id}/send-message`,
        send_group_message: (inbox_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${inbox_id}/send-group-message`,
        send_inbox_event: (inbox_id) => `${TALKSPACE_BACKEND_BASE_URL}/api/inbox/${inbox_id}/publish-event`,
    }
}

export default config;
