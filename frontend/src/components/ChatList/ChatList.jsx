import './ChatList.css';
import Friend from '../Friend/Friend'
import {getPusherApp, subscribeChannel} from '../../externals/pusher';
import { useEffect } from 'react';
import config from '../../externals/config';
import { useNavigate } from 'react-router-dom';
import handleHTTPRequest from '../../httpclient';
import { selectedStates } from '../../const';
import User from '../User/User';


const ChatList = (props) => {
    const navigate = useNavigate();

    const updateFriend = (data) => {
        console.log("Data received via pusher: ", data);
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


    const updateUnseenCount = (inbox_id, count=0) => {
        props.setFriendList(prevList =>
            prevList.map(friend =>
                friend.inbox_id === inbox_id
                    ? { ...friend, unseen_count: count }
                    : friend
            )
        );
    };


    const getFriends = async(offset=0, limit=30) => {
        props.setInboxId(null);
        const url = config.inbox.get_chats(props.user_id);
        let params = {
            offset: offset,
            limit: limit,
        }
        const response  = await handleHTTPRequest('GET', url, {}, params, null);
        if (response.status !== 200){
            console.log("Error: ", response.data);
            localStorage.clear();
            navigate("/")
        }
        else{
            props.setUserList([]);
            props.setFriendList(response.data.dataSource);
        }
    }


    const getFriendsComponent = () => {
        return props.friendList.map(friend =>
            <Friend {...friend} {...props} updateUnseenCount={updateUnseenCount}/>
        )
    }


    const getUsers = async(offset=0, limit=30) => {
        props.setInboxId(null);
        let url= ""
        let params = {
            offset: offset,
            limit: limit,
        }
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
            props.setUserList(response.data.dataSource);
        }
    }


    const getUsersComponent = () => {
        return props.userList.map(user =>
            <User {...user} {...props} selectedId={props.selectedId} setSelectedId={props.setSelectedId}/>
        )
    }


    useEffect(() => {
        if(props.currentState === selectedStates.CHATS){
            getFriends();
        }else{
            getUsers();
        }

        const pusher_app = getPusherApp();
        const channel = subscribeChannel(pusher_app, `inbox_${props.user_id}`);
        if(!channel){
            console.log("Couldn't subscribe to channel.");
            return;
        }
        const handler = (data) => {
            updateFriend(data);
        }
        channel.bind('inbox', handler);
    }, [props.currentState]);


    return (
        <div className='chat-list' key="chat-list">
            {props.currentState === selectedStates.CHATS ? getFriendsComponent() : getUsersComponent()}
        </div>
    );
};

export default ChatList;
