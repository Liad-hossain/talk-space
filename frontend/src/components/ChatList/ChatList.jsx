import './ChatList.css';
import Friend from '../Friend/Friend'
import {getPusherApp, subscribeChannel} from '../../externals/pusher';
import { useEffect, useRef, useState } from 'react';
import config from '../../externals/config';
import { useNavigate } from 'react-router-dom';
import handleHTTPRequest from '../../httpclient';
import { selectedStates } from '../../const';
import User from '../User/User';
import InfiniteScroll from 'react-infinite-scroll-component';



const ChatList = (props) => {
    const navigate = useNavigate();
    const inboxIdRef = useRef(props.inboxId);
    const friendLengthRef = useRef(0);
    const userLengthRef = useRef(0);
    const searchTextRef = useRef(props.searchText);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef(null);

    const updateFriend = (data) => {
        console.log("Data received via pusher: ", data);
        const audio = new Audio("/sounds/message_received_sound.mp3");
        audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
        props.setFriendList(prevFriends => {

            if (prevFriends.some(f =>
                f.inbox_id === data.inbox_id &&
                f.last_message_timestamp === data.timestamp
            )) {
                console.log("Duplicate message detected - skipping");
                return prevFriends;
            }

            // 1. Find the index of the friend to update
            const friendIndex = prevFriends.findIndex(f => f.inbox_id === data.inbox_id && f.last_message !== data.message);

            // If friend not found, return unchanged
            if (friendIndex === -1) return prevFriends;

            // 2. Create updated friend object (immutable update)
            const updatedFriend = {
              ...prevFriends[friendIndex],
              unseen_count: ( inboxIdRef.current === data.inbox_id ? 0 : prevFriends[friendIndex].unseen_count + 1),
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


    const updateUnseenCount = (inbox_id, count=0) => {
        props.setFriendList(prevList =>
            prevList.map(friend =>
                friend.inbox_id === inbox_id
                    ? { ...friend, unseen_count: count }
                    : friend
            )
        );
    };


    const getFriends = async(is_pagination=true, limit=100, setNull=true) => {
        if(setNull){
            props.setInboxId(null);
        }
        const url = config.inbox.get_chats(props.user_id);
        let params = {
            search: props.searchText? props.searchText : null,
            offset: (is_pagination ? props.friendList.length : 0),
            limit: limit,
        }

        try{
            const response  = await handleHTTPRequest('GET', url, {}, params, null);
            if (response.status !== 200){
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/")
            }
            else{
                props.setUserList([]);
                if (!is_pagination){
                    props.setFriendList(response.data.dataSource);
                    return;
                }

                if(response.data.dataSource.length < 100){
                    setHasMore(false);
                    return;
                }
                props.setFriendList((prevItems) => [
                    ...prevItems,
                    ...response.data.dataSource,
                ]);
            }
        }catch(error){
            console.log("Error: ", error);
            localStorage.clear();
            navigate("/")
        }
    }


    const getFriendsComponent = () => {
        return props.friendList.map(friend =>
            <Friend {...friend} {...props} updateUnseenCount={updateUnseenCount}/>
        )
    }


    const getUsers = async(is_pagination=true, limit=100, setNull = true) => {
        if(setNull){
            props.setInboxId(null);
        }
        let url= ""
        let params = {
            search: props.searchText? props.searchText : null,
            offset: (is_pagination ? props.userList.length : 0),
            limit: limit,
        }
        try{
            if (props.currentState === selectedStates.GROUPS){
                url = config.inbox.get_groups(props.user_id);
            }
            else{
                url = config.inbox.get_users(props.user_id);
                if(props.currentState === selectedStates.ACTIVE_USERS){
                    params["is_active"] = true;
                }
                else if(props.currentState === selectedStates.INACTIVE_USERS){
                    params["is_active"] = false;
                }
            }
            const response  = await handleHTTPRequest('GET', url, {}, params, null);
            if (response.status !== 200){
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/")
            }
            else{
                props.setFriendList([]);
                if (!is_pagination){
                    props.setUserList(response.data.dataSource);
                    return;
                }

                if(response.data.dataSource.length === 0){
                    setHasMore(false);
                    return;
                }
                props.setUserList((prevItems) => [
                    ...prevItems,
                    ...response.data.dataSource,
                ]);
            }
        }catch(error){
            console.log("Error: ", error);
            localStorage.clear();
            navigate("/")
        }
    }


    const getUsersComponent = () => {
        return props.userList.map(user =>
            <User {...user} {...props} selectedId={props.selectedId} setSelectedId={props.setSelectedId}/>
        )
    }


    const handleClearChatEvent = (data) => {
        console.log("Chat list cleat chat event data: ",data)
        if(props.currentState === selectedStates.CHATS){
           props.setFriendList((prevList) => prevList.map(
               (friend) =>
                   friend.inbox_id === data.inbox_id
                       ? { ...friend, last_message: "" }
                       : friend
           ));
        }
    };


    const handleDeleteChatEvent = (data) => {
        if(props.currentState === selectedStates.CHATS){
            props.setFriendList((prevList) => prevList.filter(friend => friend.inbox_id !== data.inbox_id));
        }
    };

    useEffect(() => {
        inboxIdRef.current = props.inboxId;
    }, [props.inboxId]);


    useEffect(() => {
        friendLengthRef.current = props.friendList.length;
    }, [props.friendList.length]);


    useEffect(() => {
        userLengthRef.current = props.userList.length;
    }, [props.userList.length]);


    useEffect(() => {
        searchTextRef.current = props.searchText;
        if(props.currentState === selectedStates.CHATS){
            getFriends(false, 100, false);
        }else{
            getUsers(false, 100, false);
        }

    }, [props.debouncedSearchText]);


    useEffect(() => {
        setHasMore(true);
        if(props.currentState === selectedStates.CHATS){
            getFriends(false);
        }else{
            getUsers(false);
        }

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        const pusher_app = getPusherApp();
        const channel = subscribeChannel(pusher_app, `inbox_${props.user_id}`);
        if(!channel){
            console.log("Couldn't subscribe to channel.");
            return;
        }

        channel.bind('inbox', (data) => {
            updateFriend(data);
        });

        channel.bind('clear_chat', (data) => {
            handleClearChatEvent(data);
        });


        channel.bind('delete_chat', (data) => {
            handleDeleteChatEvent(data);
        })

    }, [props.currentState, props.isCreateGroup]);


    return (
        <div className='chat-list' key="chat-list" id="scrollableChatContainer" ref={scrollRef}>
            <InfiniteScroll
                key={props.inboxId}
                dataLength={props.currentState === selectedStates.CHATS ? props.friendList.length : props.userList.length}
                next={props.currentState === selectedStates.CHATS ? getFriends : getUsers}
                hasMore={hasMore}
                scrollableTarget="scrollableChatContainer"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    height: '100%'
                }}
                className='chatlist-scroll'
            >
                {props.currentState === selectedStates.CHATS ? getFriendsComponent() : getUsersComponent()}
            </InfiniteScroll>
        </div>
    );
};

export default ChatList;
