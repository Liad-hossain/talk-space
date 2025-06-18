import './ClearChat.css';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { InboxEvents, selectedStates } from '../../const';


const ClearChat = (props) => {

    console.log("User Id: ", props.user_id);
    const handleClearChat = async()=>{
        try{
            const response = await handleHTTPRequest("POST", config.inbox.send_inbox_event(props.inboxId), {}, null, {
                event: InboxEvents.CLEAR_CHAT,
                data: {
                    user_id: props.user_id
                }
            });

            if (response.status === 200){
                props.setIsClearChat(false);
                props.setConversations([]);
                if(props.currentState === selectedStates.CHATS){
                    props.setFriendList((prevList) => prevList.map(
                        (friend) =>
                            friend.inbox_id === props.inboxId
                                ? { ...friend, last_message: "" }
                                : friend
                    ));
                }else{
                    props.setUserList((prevList) => prevList.map(
                        (friend) =>
                            friend.inbox_id === props.inboxId
                                ? { ...friend, last_message: "" }
                                : friend
                    ));
                }
            }
        }catch(error){
            console.log("Error: ", error);
        }
    }
    return (
        <div className="clear-chat-overlay">
            <div className='clear-chat-container'>
                <span className="clear-chat-header">Clear this chat?</span>
                <span className="clear-chat-desc">This chat will be empty but will remain in your chat list.</span>
                <div className="clear-button-container">
                    <button className='clear-chat-cancel' onClick={()=>props.setIsClearChat(false)}>Cancel</button>
                    <button className='clear-chat-confirm' onClick={handleClearChat}>Clear chat</button>
                </div>
            </div>
        </div>
    );
};

export default ClearChat;
