import './ChatList.css';
import Friend from '../Friend/Friend'
import axios from 'axios';
import {getPusherApp, subscribeChannel} from '../../externals/pusher';
import { useState, useEffect } from 'react';
import config from '../../externals/config';
import { useNavigate } from 'react-router-dom';


const ChatList = (props) => {
    const navigate = useNavigate();

    const logout = async() => {
        try {
            const response = await axios.get(config.auth.logout());
            if (response.status === 200) {
                navigate('/')
            }
            else{
                console.log('Error:', response.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const [friendList, setFriendList] = useState([]);
    const updateFriend = (data) => {
        console.log("Data received via pusher: ", data);
        setFriendList(prevList =>
            prevList.map(friend =>
                friend.id === data.id ? data : friend
            )
        )
        console.log("Friend List after update: ",friendList);
    }

    useEffect(() => {
        const getFriendsChat = async() => {
            let friendList = [];

            try {
                const response = await axios.get(
                    config.chat.get_conversations(props.user_id),
                    {
                        headers: {
                            'Authorization': `Token ${props.access_token}`,
                        }
                    }
                )
                if (response.status === 200) {
                    friendList = response.data.data;
                    console.log('Success: ', response.data);
                }
                else if(response.status === 401){
                    console.log("Unauthorized access, logging out.")
                    logout();
                }
                else{
                    console.log('Error: ', response.data);
                }
            } catch (error) {
                console.log(error);
            }
            setFriendList(friendList);
        }

        getFriendsChat();
        const pusher_app = getPusherApp();
        const channel = subscribeChannel(pusher_app, `User-${props.user_id}`);
        if(!channel){
            console.log("Couldn't subscribe to channel.");
            return;
        }
        channel.bind('message', (data) => {
            console.log(data);
            updateFriend(data);
        });
    }, []);

    useEffect(() => {
        console.log("FriendList: ", friendList);
    }, [friendList]);

    return (
        <div className='chat-list'>
            {Array.isArray(friendList) && friendList.map(friend =>
            <Friend {...friend} chatId = {props.chatId} setChatId = {props.setChatId}/>
            )}
        </div>
    );
};

export default ChatList;
