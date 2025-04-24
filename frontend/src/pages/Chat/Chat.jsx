import ChatList from '../../components/ChatList/ChatList';
import Conversation from '../../components/Conversation/Conversation';
import './Chat.css';
import MenuIcon from '../../assets/icons/menu.svg';
import SearchIcon from '../../assets/icons/search.svg';
import { useState } from 'react';


const Chat = () => {
    const [userId, setUserId] = useState(null);
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
                    <ChatList userId={userId} setUserId={setUserId}/>
                </div>
            </div>
            <div className="chat-right">
                {userId == null ? <div className="default-chat-bg"></div> : <Conversation user_id={userId}/>}
            </div>
        </div>
    );
};

export default Chat;
