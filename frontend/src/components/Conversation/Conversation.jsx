import React from 'react';
import './Conversation.css';
import MyContent from '../Content/MyContent';
import FriendContent from '../Content/FriendContent';
import DateContent from '../Content/DateContent';
import SendIcon from '../../assets/icons/send_icon.svg';
import PlusIcon from '../../assets/images/plus.png';
import ThreeDots from '../../assets/icons/three_dots.svg';
import config from '../../externals/config';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import handleHTTPRequest from '../../httpclient';
import { getPusherApp, subscribeChannel } from '../../externals/pusher';
import EmojiPickerButton from '../../externals/EmojiPickerButton';
import InfiniteScroll from 'react-infinite-scroll-component';
import { convertDatetimeToShowDate } from '../../utils';
import ImageConversation from '../ImageConversation/ImageConversation';
import UserMenuItems from '../UserMenuItems/UserMenuItems';
import GroupMenuItems from '../GroupMenuItems/GroupMenuItems';
import ClearChat from '../ClearChat/ClearChat';
import { InboxEvents } from '../../const';
import DeleteChat from '../DeleteChat/DeleteChat';


const Conversation = (props) => {
    const [conversations, setConversations] = useState([]);
    const inboxIdRef = useRef(props.inboxId);
    const [hasMore, setHasMore] = useState(true);
    const [hasMessage, setHasMessage] = useState(false);
    const scrollRef = useRef(null);
    const formRef = useRef(null);
    const navigate = useNavigate();

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const fileInputRef = useRef(null);


    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef();
    const [isClearChat, setIsClearChat] = useState(false);
    const [isDeleteChat, setIsDeleteChat] = useState(false);


    const getConversations = async(inbox_id = inboxIdRef.current, is_pagination=true, limit=50) => {
        if(!inbox_id){
            setConversations([]);
            setHasMore(false);
            return;
        }
        const url = config.inbox.get_conversations(inbox_id);
        const params = {
            offset: (is_pagination ? conversations.length : 0),
            limit: limit,
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
                if(response.data.dataSource.length < limit){
                    setHasMore(false);
                }
                return;
            }

            setConversations((prevItems) => [
                ...prevItems,
                ...response.data.dataSource,
            ]);

            if(response.data.dataSource.length < limit){
                setHasMore(false);
            }
        }
    }

    const getConversationComponents = (conversation_list) =>{
        if (!conversation_list || !Array.isArray(conversation_list)) {
            return null;
        }
        let date=null;
        let components = []
        conversation_list.map((conversation) => {
            let currentDate = convertDatetimeToShowDate(conversation.created_at);
            if(date === null){
                date=currentDate;
            }else if(date!==currentDate){
                components.push(<DateContent date={date} />)
                date=currentDate;
            }

            if(conversation.sender_id === props.user_id){
                components.push(<MyContent {...conversation} />)
            }else{
                components.push(<FriendContent {...conversation} isGroup={props.isGroup}/>)
            }
        })

        components.push(<DateContent date={date} />);
        return components;
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


    const addConversations = async(newConversation, toPublishEvent = true) => {
        if(!newConversation || newConversation.inbox_id !== inboxIdRef.current){
            return;
        }

        let isExists = false;
        setConversations(prevConversations => {
            // Check if message already exists in current state
            const exists = prevConversations.some(
              conv => conv.message_id === newConversation.message_id
            );

            if (exists) {
                isExists = true;
                console.log("Message already exists, skipping");
                return prevConversations;
            }
            console.log("Adding new message");
            return [newConversation, ...prevConversations];
        });

        const body = {
            event: InboxEvents.SEEN,
            data: {
                user_id: props.user_id,
            }
        }

        if(toPublishEvent &&newConversation.inbox_id && newConversation.inbox_id === props.inboxId && !isExists){
            await handleHTTPRequest('POST', config.inbox.send_inbox_event(newConversation.inbox_id), {}, null, body);
        }
    }


    const handleDetailsClick = () => {
        if(props.isGroup){
            props.setIsGroupDetailsClicked(!props.isGroupDetailsClicked);
        }else{
            props.setIsUserDetailsClicked(!props.isUserDetailsClicked);
        }
    }

    const handleSendMessage = async(e) => {
        e.preventDefault();
        const message = formRef.current.message.value;
        formRef.current.message.value = "";
        const image = selectedImage;
        const imageFile = selectedImageFile;
        setSelectedImage(null);
        setSelectedImageFile(null);
        setHasMessage(false);
        if(!message.trim() && !imageFile){
            console.log("No message and attachment fount. So not sending.");
            return;
        }

        try{
            const data = new FormData();
            data.append("sender_id", props.user_id)
            if (!props.isGroup){
                data.append("receiver_id", props.members.filter(member => member.user_id !== props.user_id).map(member => member.user_id)[0])
            }
            data.append("text", message)
            if(imageFile){
                data.append("attachment", imageFile);
            }

            const sender = props.members.filter(member => member.user_id === props.user_id)[0];

            const newChat = {
                "inbox_id": inboxIdRef.current,
                "sender_id": props.user_id,
                "message": message? "You: " + message.substring(0,20) + (message.length > 20 ? "..." : "") : "You: 📸 photo",
                "timestamp": Math.floor(Date.now() / 1000),
            }
            updateFriend(newChat);

            const newConversation = {
                "inbox_id": inboxIdRef.current,
                "message_id": Math.floor(Date.now() / 1000),
                "sender_id": props.user_id,
                "sender_name": sender.username,
                "sender_profile_photo": sender.profile_photo,
                "receiver_id": data.receiver_id,
                "text": message,
                "has_attachment": false,
                "attachment": image,
                "created_at": new Date().toISOString(),
                "updated_at": new Date().toISOString(),
            }
            addConversations(newConversation, false);

            let response = null
            if(!props.isGroup){
                response = await handleHTTPRequest('POST', config.inbox.send_message(data.get("receiver_id")), {}, null, data);
            }else{
                response = await handleHTTPRequest('POST', config.inbox.send_group_message(inboxIdRef.current), {}, null, data);
            }
            if(response.status !== 200){
                console.log("Error: ", response.data);

            }

            const audio = new Audio("/sounds/message_send_audio.mp3");
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
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

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target.result);
            };
            reader.readAsDataURL(file);
            setSelectedImageFile(file);
        }
    };


    const get_active_text = () => {
        if(props.isGroup){
            return null;
        }

        if(props.isActive){
            return "Active now";
        }

        const pastTime = new Date(props.lastActiveTime);
        const currentTime = new Date();

        // Calculate difference in milliseconds and convert to seconds
        const secondsAgo = Math.floor((currentTime - pastTime) / 1000);

        if(secondsAgo < 60){
            return "Active " +secondsAgo + " seconds ago";
        }
        else if(secondsAgo >=60 && secondsAgo < 3600){
            return "Active " + Math.floor(secondsAgo / 60) + " minutes ago";
        }
        else if(secondsAgo >=3600 && secondsAgo < 86400){
            return "Active " + Math.floor(secondsAgo / 3600) + " hours ago";
        }
        return null
    }


    const handleClearChatEvent = (data) => {
        console.log("Conversation Clear chat event data: ", data);
        if(data.inbox_id === inboxIdRef.current){
            setConversations([]);
            setHasMore(false);
        }
    };


    const handleDeleteChatEvent = (data) => {
        console.log("Delete chat event: ", data);
        if(data.inbox_id === inboxIdRef.current){
            setConversations([]);
            setHasMore(false);
            props.setInboxId(null);
        }
    };


    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
              setOpenMenu(false);
            }
          };
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        inboxIdRef.current = props.inboxId;
        setHasMore(true);    //Need to set it before calling getConversations because if the conversations is empty then making it false again
        getConversations(props.inboxId,false);
        props.setIsGroupDetailsClicked(false);
        props.setIsUserDetailsClicked(false);
        props.setIsGroupDetailsClicked(false);

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        const pusher_app = getPusherApp();
        const messageChannel = subscribeChannel(pusher_app, `message_${props.user_id}`);
        if(!messageChannel){
            console.log("Couldn't subscribe to message channel.");
            return;
        }
        messageChannel.bind('message', (data) => {
            addConversations(data);
        });

        messageChannel.bind('clear_chat', (data) => {
            handleClearChatEvent(data);
        });

        messageChannel.bind('delete_chat', (data) => {
            handleDeleteChatEvent(data);
        });
    },[props.inboxId, props.user_id]);


    const imageConversationArgs = {
        selectedImage: selectedImage,
        setSelectedImage: setSelectedImage,
        selectedImageFile: selectedImageFile,
        setSelectedImageFile: setSelectedImageFile,
        handleSendMessage: handleSendMessage,
    }


    const userMenuArgs = {
        setOpenMenu: setOpenMenu,
        setIsUserDetailsClicked: props.setIsUserDetailsClicked,
        setIsGroupDetailsClicked: props.setIsGroupDetailsClicked,
        receiver_id: props.receiver_id,
        setIsClearChat: setIsClearChat,
        setIsDeleteChat: setIsDeleteChat,
        setIsExitGroup: props.setIsExitGroup,
        currentState: props.currentState,
    }

    const clearChatArgs = {
        user_id: props.user_id,
        setIsClearChat: setIsClearChat,
        setIsDeleteChat: setIsDeleteChat,
        inboxId: props.inboxId,
        setInboxId: props.setInboxId,
        setConversations: setConversations,
        currentState: props.currentState,
        setFriendList: props.setFriendList,
        setUserList: props.setUserList,
    }


    return (
        <div className='conversation'>
            {
                selectedImage &&
                <ImageConversation {...imageConversationArgs}/>
            }
            {
                isClearChat &&
                <ClearChat {...clearChatArgs}/>
            }
            {
                isDeleteChat &&
                <DeleteChat {...clearChatArgs}/>
            }
            <div className="conversation-top">
                <div className="conversation-image-container">
                    <img src={props.inboxImage} alt="My Profile" className='conversation-profile' onClick={handleDetailsClick}/>
                    {props.isActive && <div className="conversation-active-status"></div>}
                </div>
                <div className="user-status">
                    <span className='user-name'>{props.inboxName}</span>
                    <span className='user-status-text'>{get_active_text()}</span>
                </div>
                <div className="three-dots-container" ref={menuRef}>
                    <img src={ThreeDots} alt='Three Dots Icon' className='three-dots-icon' width={40} height={40} onClick={()=>setOpenMenu(!openMenu)}/>
                    {
                        openMenu && !props.isGroup &&
                        <UserMenuItems {...userMenuArgs}/>
                    }
                    {
                        openMenu && props.isGroup &&
                        <GroupMenuItems {...userMenuArgs}/>
                    }
                </div>
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
                    <input type='text' name='message' placeholder='Type a message here...' className='text-input' onChange={(e) => setHasMessage(e.target.value.length > 0)}/>
                    {   hasMessage &&
                        <button type='submit' className='send-icon-button'>
                            <img src={SendIcon} alt='Send Icon' width={30} height={30} className='send-icon'/>
                        </button>
                    }
                    { !hasMessage &&
                        <div className="plus-icon-button">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <img src={PlusIcon} alt='Plus Icon' width={30} height={30} className='plus-icon' onClick={handleImageClick}/>
                        </div>
                    }
                </form>
            </div>
        </div>
    );
};

export default Conversation;
