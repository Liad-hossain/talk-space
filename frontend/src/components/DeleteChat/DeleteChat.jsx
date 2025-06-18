import './DeleteChat.css';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { selectedStates } from '../../const';
import { InboxEvents } from '../../const';


const DeleteChat = (props) => {

    const handleDeleteChat = async()=>{
        try{
            const response = await handleHTTPRequest("POST", config.inbox.send_inbox_event(props.inboxId), {}, null, {
                event: InboxEvents.DELETE_CHAT,
                data: {
                    user_id: props.user_id
                }
            });

            if (response.status === 200){
                props.setIsDeleteChat(false);
                props.setConversations([]);
                props.setInboxId(null);
                if(props.currentState === selectedStates.CHATS){
                    props.setFriendList((prevList) => prevList.filter(
                        (friend) =>
                            friend.inbox_id !== props.inboxId
                    ));
                }else{
                    props.setUserList((prevList) => prevList.filter(
                        (friend) =>
                            friend.inbox_id !== props.inboxId
                    ));
                }
            }
        }catch(error){
            console.log("Error: ", error);
        }
    }
    return (
        <div className="delete-chat-overlay">
            <div className='delete-chat-container'>
                <span className="delete-chat-header">Delete this chat?</span>
                <span className="delete-chat-desc">This chat will be empty and also will be deleted from your chatlist.</span>
                <div className="delete-button-container">
                    <button className='delete-chat-cancel' onClick={()=>props.setIsDeleteChat(false)}>Cancel</button>
                    <button className='delete-chat-confirm' onClick={handleDeleteChat}>Delete chat</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteChat;
