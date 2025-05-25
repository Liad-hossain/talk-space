import './Conversation.css';
import MyContent from '../Content/MyContent';
import FriendContent from '../Content/FriendContent';
import Profile from '../../assets/icons/profile_avatar.svg';
import SmileIcon from '../../assets/icons/smile_icon.svg'
import SendIcon from '../../assets/icons/send_icon.svg';
import ThreeDots from '../../assets/icons/three_dots.svg';
import config from '../../externals/config';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import handleHTTPRequest from '../../httpclient';
import { getPusherApp, subscribeChannel } from '../../externals/pusher';


const Conversation = (props) => {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();


    const getConversations = async(inbox_id) => {
        if(!inbox_id){
            setConversations([]);
            return [];
        }
        const url = config.inbox.get_conversations(inbox_id)
        const response = await handleHTTPRequest('GET', url, {}, null, null);
        if (response.status !== 200){
            console.log("Error: ", response.data);
            localStorage.clear();
            navigate("/")
        }
        else{
            setConversations(response.data.dataSource);
            return response.data.dataSource;
        }
        return [];
    }

    const getConversationComponents = (conversation_list) =>{
        if (!conversation_list || !Array.isArray(conversation_list)) {
            return null;
        }
        return conversation_list.map((conversation) => {
            if(conversation.sender_id === props.user_id){
                return <MyContent {...conversation}/>
            }else{
                return <FriendContent {...conversation}/>
            }
        })
    }


    const updateFriend = (data) => {
        props.setFriendList(prevFriends => {
            // 1. Find the index of the friend to update
            const friendIndex = prevFriends.findIndex(f => f.inbox_id === data.inbox_id);

            // If friend not found, return unchanged
            if (friendIndex === -1) return prevFriends;

            // 2. Create updated friend object (immutable update)
            const updatedFriend = {
              ...prevFriends[friendIndex],
              last_message: data.message,
              last_message_timestamp: data.timestamp,
              last_message_sender: data.sender_id
            };

            // 3. Create new array with:
            // - Updated friend first
            // - Then all other friends in original order (except the updated one)
            return [
              updatedFriend,
              ...prevFriends.slice(0, friendIndex),
              ...prevFriends.slice(friendIndex + 1)
            ];
        });
    }


    const updateConversations = (newConversation) => {
        if(!newConversation || newConversation.inbox_id !== props.inboxId){
            return;
        }

        setConversations(prevConversations => {
            // Check if message already exists in current state
            const exists = prevConversations.some(
              conv => conv.message_id === newConversation.message_id
            );

            if (exists) {
              console.log("Message already exists, skipping");
              return prevConversations;
            }

            console.log("Adding new message");
            return [newConversation, ...prevConversations];
          });
    }

    const handleSendMessage = async(e) => {
        e.preventDefault();
        const message = e.target.message.value
        e.target.message.value = "";
        if(!message){
            console.log("Message is empty. So not sending.");
            return;
        }

        try{
            const data = {
                sender_id: props.user_id,
                receiver_id: props.members.filter(member => member.user_id !== props.user_id).map(member => member.user_id)[0],
                text: message,
                attachments: []
            }

            const newChat = {
                "inbox_id": props.inboxId,
                "sender_id": props.user_id,
                "message": message.substring(0,20) + (message.length > 20 ? "..." : ""),
                "timestamp": Math.floor(Date.now() / 1000),
            }
            updateFriend(newChat);

            const newConversation = {
                "inbox_id": props.inboxId,
                "message_id": Math.floor(Date.now() / 1000),
                "sender_id": props.user_id,
                "receiver_id": data.receiver_id,
                "text": message,
                "has_attachment": false,
                "attachments": [],
                "created_at": new Date().toISOString(),
                "updated_at": new Date().toISOString(),
            }
            updateConversations(newConversation);

            const response = await handleHTTPRequest('POST', config.inbox.send_message(data.receiver_id), {}, null, data);
            if(response.status !== 200){
                console.log("Error: ", response.data);

            }
        }catch(error){
            console.log("Error: ", error);
        }
    }

    useEffect(() => {
        getConversations(props.inboxId);
        const pusher_app = getPusherApp();
        const channel = subscribeChannel(pusher_app, `message_${props.user_id}`);
        if(!channel){
            console.log("Couldn't subscribe to channel.");
            return;
        }
        const handler = (data) => {
            updateConversations(data);
        }
        channel.bind('message', handler);
    },[props.inboxId, props.user_id]);


    return (
        <div className='conversation'>
            <div className="conversation-top">
                <img src={Profile} alt="My Profile" width={50} height={50} className='conversation-profile'/>
                <div className="user-status">
                    <span className='user-name'>{props.inboxName}</span>
                    <span className='user-status-text'>Active now</span>
                </div>
                <img src={ThreeDots} alt='Three Dots Icon' width={50} height={50} className='three-dots-icon'/>
            </div>
            <div className="conversation-bottom">
                <div className='conversation-content'>
                    {getConversationComponents(conversations)}
                </div>
                <form className="send-box" onSubmit={handleSendMessage}>
                    <img src={SmileIcon} alt='Smile Icon' width={25} height={25} className='smile-icon'/>
                    <input type='text' name='message' placeholder='Type a message here...' className='text-input'/>
                    <button type='submit' className='send-icon-button'>
                        <img src={SendIcon} alt='Send Icon' width={30} height={30} className='send-icon'/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;
