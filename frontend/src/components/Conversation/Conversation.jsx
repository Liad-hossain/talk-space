import React from 'react';
import './Conversation.css';
import MyContent from '../Content/MyContent';
import FriendContent from '../Content/FriendContent';
import Profile from '../../assets/icons/profile_avatar.svg';
import SendIcon from '../../assets/icons/send_icon.svg';
import ThreeDots from '../../assets/icons/three_dots.svg';
import config from '../../externals/config';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import handleHTTPRequest from '../../httpclient';
import { getPusherApp, subscribeChannel } from '../../externals/pusher';
import EmojiPickerButton from '../../externals/EmojiPickerButton';
import InfiniteScroll from 'react-infinite-scroll-component';


const Conversation = (props) => {
    const [conversations, setConversations] = useState([]);
    const inboxIdRef = useRef(props.inboxId);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef(null);
    const formRef = useRef(null);
    const navigate = useNavigate();


    const getConversations = async(inbox_id = inboxIdRef.current, is_pagination=true) => {
        if(!inbox_id){
            setConversations([]);
            setHasMore(false);
            return;
        }
        const url = config.inbox.get_conversations(inbox_id);
        const params = {
            offset: (is_pagination ? conversations.length : 0),
            limit: 100,
        }
        const response = await handleHTTPRequest('GET', url, {}, params, null);
        if (response.status !== 200){
            console.log("Error: ", response.data);
            localStorage.clear();
            navigate("/")
        }
        else{
            if(!is_pagination){
                setConversations(response.data.dataSource);
                return;
            }

            if(response.data.dataSource.length < 100){
                setHasMore(false);
                return;
            }
            setConversations((prevItems) => [
                ...prevItems,
                ...response.data.dataSource,
            ]);
        }
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
        if(!newConversation || newConversation.inbox_id !== inboxIdRef.current){
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
        const message = formRef.current.message.value;
        formRef.current.message.value = "";
        if(!message.trim()){
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
                "inbox_id": inboxIdRef.current,
                "sender_id": props.user_id,
                "message": message.substring(0,20) + (message.length > 20 ? "..." : ""),
                "timestamp": Math.floor(Date.now() / 1000),
            }
            updateFriend(newChat);

            const newConversation = {
                "inbox_id": inboxIdRef.current,
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

    const handleEmojiSelect = (emoji, e) => {
        formRef.current.message.value += emoji;
        console.log(e.target.value);
    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage(e);
        }
    };


    useEffect(() => {
        inboxIdRef.current = props.inboxId;
        setHasMore(true);    //Need to set it before calling getConversations because if the conversations is empty then making it false again
        getConversations(props.inboxId,false);

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        const pusher_app = getPusherApp();
        const channel = subscribeChannel(pusher_app, `message_${props.user_id}`);
        if(!channel){
            console.log("Couldn't subscribe to channel.");
            return;
        }
        channel.bind('message', (data) => {
            updateConversations(data);
        });
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
                <div className='conversation-content' id="scrollableConversationContainer" ref={scrollRef}>
                    <InfiniteScroll
                        key={props.inboxId}
                        dataLength={conversations.length}
                        next={getConversations}
                        hasMore={hasMore}
                        loader={hasMore && <h4 style={{ position: 'absolute', left: '60%', top: '50%', zIndex: 10, padding: '10px 20px', borderRadius: '20px' }}>Loading...</h4>}
                        inverse={true}
                        scrollableTarget="scrollableConversationContainer"
                        style={{
                            display: 'flex',
                            flexDirection: 'column-reverse', // Critical for reverse scroll
                            overflowY: 'auto',
                            height: '100%'
                        }}
                        className='conversation-scroll'
                    >
                        {getConversationComponents(conversations)}
                    </InfiniteScroll>
                </div>
                <form ref={formRef} className="send-box" onKeyDown={handleKeyDown} onSubmit={handleSendMessage}>
                    <EmojiPickerButton onEmojiClick={handleEmojiSelect}/>
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
