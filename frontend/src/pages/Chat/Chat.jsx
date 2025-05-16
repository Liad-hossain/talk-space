import ChatList from '../../components/ChatList/ChatList';
import Conversation from '../../components/Conversation/Conversation';
import './Chat.css';
import MenuIcon from '../../assets/icons/menu.svg';
import SearchIcon from '../../assets/icons/search.svg';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


const Chat = () => {
    const [chatId, setChatId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const {user_id, access_token, refresh_token} = location.state || {};

    useEffect(() => {
        if(!user_id || !access_token || !refresh_token){
            navigate('/')
        }
    })

    return (
        <div className='chat'>
            <div className="chat-left">
                <div className="chat-left-top">
                    <img src={MenuIcon} alt="Menu LOGO" width={30} height={30} className='menu-icon'/>
                    <div className='search'>
                        <img src={SearchIcon} alt="Search LOGO" width={30} height={30} className='search-icon'/>
                        <input type='search' placeholder='Search' className='user-search'/>
                    </div>
                    <div className="filter-user">
                        <span>All Users</span>
                        <span>Active Users</span>
                        <span>Inactive Users</span>
                        <span>Groups</span>
                    </div>
                </div>
                <div className="chat-left-bottom">
                    <ChatList chatId={chatId} setChatId={setChatId} user_id={user_id} access_token={access_token} refresh_token={refresh_token}/>
                </div>
            </div>
            <div className="chat-right">
                {chatId == null ? <div className="default-chat-bg"></div> : <Conversation chatId={chatId} access_token={access_token} refresh_token={refresh_token}/>}
            </div>
        </div>
    );
};

export default Chat;
