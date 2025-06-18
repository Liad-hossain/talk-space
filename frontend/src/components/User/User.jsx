import React from 'react';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import './User.css';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { InboxEvents } from '../../const';
import { selectedStates } from '../../const';


const User = (props) => {
    const handleUserClick = async() => {
        props.setInboxId(props.inbox_id);
        props.setInboxName(props.inbox_name || props.username);
        props.setInboxImage(props.profile_photo ? props.profile_photo : ProfileIcon);
        props.setMembers(props.inbox_members);
        props.setIsGroup(props.is_group);
        props.setSelectedId(props.currentState === selectedStates.GROUPS ? props.inbox_id : props.id);
        props.setIsActive(props.is_active);
        props.setLastActiveTime(props.last_active_time);

        const body = {
            event: InboxEvents.SEEN,
            data: {
                user_id: props.user_id,
            }
        }
        await handleHTTPRequest('POST', config.inbox.send_inbox_event(props.inbox_id), {}, null, body);

    }

    const get_last_active_time = () => {
        const pastTime = new Date(props.last_active_time);
        const currentTime = new Date();

        // Calculate difference in milliseconds and convert to seconds
        const secondsAgo = Math.floor((currentTime - pastTime) / 1000);

        if(secondsAgo < 60){
            return secondsAgo + "s";
        }
        else if(secondsAgo >=60 && secondsAgo < 3600){
            return Math.floor(secondsAgo / 60) + "m";
        }
        else if(secondsAgo >=3600 && secondsAgo < 86400){
            return Math.floor(secondsAgo / 3600) + "h";
        }
        return null
    }

    const myId = props.currentState === selectedStates.GROUPS ? props.inbox_id : props.id;

    return (
        <div className='user-selected' key={myId} onClick={handleUserClick} style={{backgroundColor: myId === props.selectedId ? "var(--clicked-chatbox-color)" : undefined}}>
            <div className="inbox-profile-container">
                <img src={props.profile_photo || ProfileIcon} alt="My Profile" width={50} height={50} className='inbox-profile'/>
                {props.is_active ? <div className="active-status"></div> : (get_last_active_time() != null) && <div className="inactive-status">{get_last_active_time()}</div>}
            </div>
            <span className='inbox-name'>{props.inbox_name || props.username}</span>
        </div>
    );
};

export default User;
