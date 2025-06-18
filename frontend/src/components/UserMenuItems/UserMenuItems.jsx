import './UserMenuItems.css';
import { useState } from 'react';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { useNavigate } from 'react-router-dom';
import { selectedStates } from '../../const';


const UserMenuItems = (props) => {
    const [profileDetails, setProfileDetails] = useState(null);
    const navigate = useNavigate();


    const fetch_profile_data = async () => {
        try {
          const response = await handleHTTPRequest(
            "GET",
            config.auth.get_profile(props.receiver_id),
            {},
            null,
            null
          );
          if (response.status === 200) {
            setProfileDetails(response.data.dataSource);
          } else {
            console.log("Error: ", response.data);
            localStorage.clear();
            navigate("/");
          }
        } catch (error) {
          console.log("Error: ", error);
          localStorage.clear();
          navigate("/");
        }
    };

    const handleProfileClick = async() => {
        await fetch_profile_data();
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
