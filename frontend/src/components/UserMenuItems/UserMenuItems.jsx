import './UserMenuItems.css';
import { selectedStates } from '../../const';


const UserMenuItems = (props) => {


    const handleProfileClick = async() => {
        props.setOpenMenu(false);
        props.setIsUserDetailsClicked(true);
    }

    return (
        <div className='user-menu-items-container'>
            <span className="user-menu-items" onClick={handleProfileClick}>Profile</span>
            <span className="user-menu-items" onClick={()=>{props.setOpenMenu(false); props.setIsClearChat(true);}}>Clear Chat</span>
            {props.currentState === selectedStates.CHATS && <span className="user-menu-items" onClick={()=>{props.setOpenMenu(false); props.setIsDeleteChat(true);}}>Delete Chat</span>}
        </div>
    );
};

export default UserMenuItems;
