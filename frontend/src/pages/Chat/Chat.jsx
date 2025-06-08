import ChatList from '../../components/ChatList/ChatList';
import Conversation from '../../components/Conversation/Conversation';
import './Chat.css';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import SearchIcon from '../../assets/icons/search.svg';
import ChatIcon from '../../assets/icons/chat-icon.svg';
import GroupIconImage from '../../assets/images/group.png';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../externals/config';
import { selectedStates } from '../../const';
import { toast } from 'react-toastify';
import GroupCreation from '../../components/GroupCreation/GroupCreation';


function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
}

const Chat = () => {
    const [inboxId, setInboxId] = useState(null);
    const [inboxName, setInboxName] = useState("");
    const [currentState, setCurrentState] = useState(selectedStates.CHATS);
    const [members, setMembers] = useState([]);

    const [selectedId, setSelectedId] = useState(null);
    const [friendList, setFriendList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [searchText, setSearchText] = useState("");

    const [isCreateGroup, setIsCreateGroup] = useState(false);
    const [isGroup, setIsGroup] = useState(false);
    const debouncedSearchText = useDebounce(searchText, 500);


    const location = useLocation();
    const navigate = useNavigate();
    const {user_id, username} = location.state || {};

    useEffect(() => {
        if(!user_id){
            navigate('/')
        }
    })

    const logout = async() => {
        try {
            const headers = {
                'Authorization': `Token ${localStorage.getItem('access_token')}`
            }
            const response = await axios.post(config.auth.logout(), null, {headers});
            if (response.status === 200) {
                localStorage.clear();
                toast.success("Logged out successfully");
                navigate('/')
            }
            else{
                toast.error("Error Response but logged out");
                localStorage.clear();
                navigate('/')
            }
        } catch (error) {
            toast.error("Error Response but logged out");
            localStorage.clear();
            navigate('/')
        }
    }

    const handleClick = async(state) => {
        if(currentState === state){
            return;
        }
        setSelectedId(null);
        setInboxId(null);
        setCurrentState(state);
        setSearchText("");
    }

    const handleCreateGroupClick = () => {
        setIsCreateGroup(true);
    }


    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    }


    const args = {
        inboxId:inboxId,
        setInboxId: setInboxId,
        inboxName: inboxName,
        setInboxName: setInboxName,
        user_id: user_id,
        members: members,
        setMembers: setMembers,
        currentState: currentState,
        selectedId: selectedId,
        setSelectedId: setSelectedId,
        friendList: friendList,
        setFriendList: setFriendList,
        userList: userList,
        setUserList: setUserList,
        searchText: searchText,
        debouncedSearchText: debouncedSearchText,
        isCreateGroup: isCreateGroup,
        isGroup: isGroup,
        setIsGroup: setIsGroup,
    }


    return (
        <div className='chat'>
            {
                isCreateGroup &&
                <GroupCreation setIsCreateGroup={setIsCreateGroup} user_id={user_id}/>
            }
            <div className="chat-left">
                <div className="chat-left-top">
                    <div className="topmost">
                        <img src={ProfileIcon} alt="Profile LOGO" width={30} height={30} className='profile-icon'/>
                        <span className='username'>{username}</span>
                        <div className="custom-tooltip-container">
                            <img src={ChatIcon} alt="Chat LOGO" width={30} height={30} className='chat-icon' onClick={() => handleClick(selectedStates.CHATS)} style={{boxShadow: currentState === selectedStates.CHATS ? "0 2px 0 #FAF9F6" : undefined}}/>
                            <span className="custom-tooltip">Chats</span>
                        </div>
                        <div className="custom-tooltip-container">
                            <img src={GroupIconImage} alt="Group Logo" width={30} height={30} className='group-button' onClick={handleCreateGroupClick}/>
                            <span className="custom-tooltip">Create New Group</span>
                        </div>
                        <span className="logout" onClick={logout}>Logout</span>
                    </div>
                    <div className='search'>
                        <img src={SearchIcon} alt="Search LOGO" width={30} height={30} className='search-icon'/>
                        <input type='search' placeholder='Search' className='user-search' value={searchText} onChange={handleSearchChange}/>
                    </div>
                    <div className="filter-user">
                        <span onClick={() => handleClick(selectedStates.ALL_USERS)} style={{textDecoration: currentState === selectedStates.ALL_USERS ? "underline" : undefined, ...(currentState === selectedStates.ALL_USERS && {textDecorationThickness: "2px",textUnderlineOffset: "4px"})}}>All Users</span>
                        <span onClick={() => handleClick(selectedStates.ACTIVE_USERS)} style={{textDecoration: currentState === selectedStates.ACTIVE_USERS ? "underline" : undefined, ...(currentState === selectedStates.ALL_USERS && {textDecorationThickness: "2px",textUnderlineOffset: "4px"})}}>Active Users</span>
                        <span onClick={() => handleClick(selectedStates.INACTIVE_USERS)} style={{textDecoration: currentState === selectedStates.INACTIVE_USERS ? "underline" : undefined, ...(currentState === selectedStates.ALL_USERS && {textDecorationThickness: "2px",textUnderlineOffset: "4px"})}}>Inactive Users</span>
                        <span onClick={() => handleClick(selectedStates.GROUPS)} style={{textDecoration: currentState === selectedStates.GROUPS ? "underline" : undefined, ...(currentState === selectedStates.ALL_USERS && {textDecorationThickness: "2px",textUnderlineOffset: "4px"})}}>Groups</span>
                    </div>
                </div>
                <div className="chat-left-bottom">
                    <ChatList {...args}/>
                </div>
            </div>
            <div className="chat-right">
                {inboxId == null ? <div className="default-chat-bg"></div> : <Conversation {...args}/>}
            </div>
        </div>
    );
};

export default Chat;
