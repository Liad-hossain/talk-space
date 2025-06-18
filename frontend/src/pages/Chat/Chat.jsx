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
import { selectedStates } from '../../const';
import GroupCreation from '../../components/GroupCreation/GroupCreation';
import Account from '../../components/Account/Account';
import config from '../../externals/config';
import handleHTTPRequest from '../../httpclient';
import ContactDetails from '../../components/UserDetails/UserDetails';


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
    const [receiver_id, setReceiverId] = useState(null);
    const [inboxName, setInboxName] = useState("");
    const [inboxImage, setInboxImage] = useState(ProfileIcon);
    const [currentState, setCurrentState] = useState(selectedStates.CHATS);
    const [members, setMembers] = useState([]);

    const [selectedId, setSelectedId] = useState(null);
    const [friendList, setFriendList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [searchText, setSearchText] = useState("");

    const [isCreateGroup, setIsCreateGroup] = useState(false);
    const [isGroup, setIsGroup] = useState(false);
    const debouncedSearchText = useDebounce(searchText, 500);

    const [isActive, setIsActive] = useState(false);
    const [lastActiveTime, setLastActiveTime] = useState(null);
    const [isOpenAccount, setIsOpenAccount] = useState(false);
    const [profileData, setProfileData] = useState({});

    const [isUserDetailsClicked, setIsUserDetailsClicked] = useState(false);
    const [isGroupDetailsClicked, setIsGroupDetailsClicked] = useState(false);


    const location = useLocation();
    const navigate = useNavigate();
    let {user_id} = location.state || {};


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

    const handleProfileClick = () => {
        setIsOpenAccount(true);
        setInboxId(null);
        setIsUserDetailsClicked(false);
    }

    const get_user_profile = async() => {
        try{
            const response = await handleHTTPRequest('GET', config.auth.get_profile(user_id), {}, null, null);
            if (response.status !== 200){
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/")
            }
            else{
                setProfileData(response.data.dataSource);
            }
        }catch(error){
            console.log("Error: ", error);
            localStorage.clear();
            navigate("/")
        }
    }

    useEffect(() => {
        if(!user_id){
            navigate('/')
        }

        get_user_profile();
    }, [isOpenAccount]);


    const args = {
        inboxId:inboxId,
        setInboxId: setInboxId,
        inboxName: inboxName,
        setInboxName: setInboxName,
        inboxImage: inboxImage,
        setInboxImage: setInboxImage,
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
        isActive: isActive,
        setIsActive: setIsActive,
        lastActiveTime: lastActiveTime,
        setLastActiveTime: setLastActiveTime,
        receiver_id: receiver_id,
        setReceiverId: setReceiverId,
    }

    const extraArgs = {
        isUserDetailsClicked: isUserDetailsClicked,
        setIsUserDetailsClicked: setIsUserDetailsClicked,
        isGroupDetailsClicked: isGroupDetailsClicked,
        setIsGroupDetailsClicked: setIsGroupDetailsClicked,
    }

    return (
        <div className='chat'>
            {
                isCreateGroup &&
                <GroupCreation setIsCreateGroup={setIsCreateGroup} user_id={user_id}/>
            }
            {
                isOpenAccount &&
                <Account setIsOpenAccount={setIsOpenAccount} user_id={user_id}/>
            }
            <div className="chat-left">
                <div className="chat-left-top">
                    <div className="topmost">
                        <img src={profileData.profile_photo || ProfileIcon} alt="Profile LOGO" width={30} height={30} className='profile-icon' onClick={handleProfileClick}/>
                        <span className='username'>{profileData.username}</span>
                        <div className="custom-tooltip-container">
                            <img src={ChatIcon} alt="Chat LOGO" width={30} height={30} className='chat-icon' onClick={() => handleClick(selectedStates.CHATS)} style={{boxShadow: currentState === selectedStates.CHATS ? "0 2px 0 #FAF9F6" : undefined}}/>
                            <span className="custom-tooltip">Chats</span>
                        </div>
                        <div className="custom-tooltip-container">
                            <img src={GroupIconImage} alt="Group Logo" width={30} height={30} className='group-button' onClick={handleCreateGroupClick}/>
                            <span className="custom-tooltip">Create New Group</span>
                        </div>
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
            <div className="chat-middle">
                {inboxId == null ? <div className="default-chat-bg"></div> : <Conversation {...args} {...extraArgs}/>}
            </div>
            <div className="chat-right">
                {
                    isUserDetailsClicked && <ContactDetails receiver_id={receiver_id} setIsUserDetailsClicked={setIsUserDetailsClicked}/>
                }
            </div>
        </div>
    );
};

export default Chat;
