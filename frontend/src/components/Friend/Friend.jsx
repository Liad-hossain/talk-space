import './Friend.css';
import Profile from '../../assets/icons/profile_avatar.svg';
import '../../index.css'
import { convertTimestampToShowTime } from '../../utils';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';


const Friend = (props) => {

    const handleInboxClick = async() => {
        props.setInboxId(props.inbox_id);
        props.setInboxName(props.inbox_name);
        props.setMembers(props.inbox_members);
        props.setIsGroup(props.is_group);
        props.setIsActive(props.is_active);
        props.setLastActiveTime(props.last_active_time);

        if(props.unseen_count > 0){
            const body = {
                event: "seen",
                data: {
                    user_id: props.user_id,
                }
            }
            await handleHTTPRequest('POST', config.inbox.send_inbox_event(props.inbox_id), {}, null, body);
            props.updateUnseenCount(props.inbox_id, 0);
        }
    };


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

    return (
        <div className='friend' key={props.inbox_id} onClick={handleInboxClick} style={{backgroundColor: props.inbox_id === props.inboxId ? "var(--clicked-chatbox-color)" : undefined}}>
            <div className="friend-image-container">
                <img src={props.profile_photo || Profile} alt="My Profile" width={50} height={50} className='friend-profile'/>
                {props.is_active ? <div className="active-status"></div> : (get_last_active_time() != null) && <div className="inactive-status">{get_last_active_time()}</div>}
            </div>
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
