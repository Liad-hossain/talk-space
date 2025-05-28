import React from 'react';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import './User.css';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';


const User = (props) => {
    const handleUserClick = async() => {
        props.setInboxId(props.inbox_id);
        props.setInboxName(props.inbox_name || props.username);
        props.setSelectedId(props.inbox_id || props.id);
        props.setMembers(props.inbox_members);

        const body = {
            event: "seen",
            user_id: props.user_id,
        }
        await handleHTTPRequest('POST', config.inbox.send_inbox_event(props.inbox_id), {}, null, body);

    }

    const myId = props.inbox_id || props.id;
    return (
        <div className='user-selected' key={myId} onClick={handleUserClick} style={{backgroundColor: myId === props.selectedId ? "var(--clicked-chatbox-color)" : undefined}}>
            <img src={ProfileIcon} alt="My Profile" width={50} height={50} className='inbox-profile'/>
            <span className='inbox-name'>{props.inbox_name || props.username}</span>
        </div>
    );
};

export default User;
