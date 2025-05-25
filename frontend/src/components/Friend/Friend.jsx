import './Friend.css';
import Profile from '../../assets/icons/profile_avatar.svg';
import '../../index.css'
import { convertTimestampToShowTime } from '../../utils';


const Friend = (props) => {

    const handleClick = () => {
        props.setInboxId(props.inbox_id);
        props.setInboxName(props.inbox_name);
        props.setMembers(props.inbox_members);
        props.updateUnseenCount(props.inbox_id, 0);
    };


    return (
        <div className='friend' key={props.inbox_id} onClick={handleClick} style={{backgroundColor: props.inbox_id === props.inboxId ? "var(--clicked-chatbox-color)" : undefined}}>
            <img src={Profile} alt="My Profile" width={50} height={50} className='friend-profile'/>
            <div className="content">
                <span className='friend-name'>{props.inbox_name}</span>
                <span className='friend-text'>{props.last_message}</span>
            </div>
            <div className="friend-history">
                <span className='last-send-time'>{convertTimestampToShowTime(props.last_message_timestamp)}</span>
                {props.unseen_count > 0 && <span className='friend-unread'>{props.unseen_count}</span>}
            </div>
        </div>
    );
};

export default Friend;
