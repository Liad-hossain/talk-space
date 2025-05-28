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
        props.updateUnseenCount(props.inbox_id, 0);

        const body = {
            event: "seen",
            user_id: props.user_id,
        }
        await handleHTTPRequest('POST', config.inbox.send_inbox_event(props.inbox_id), {}, null, body);
    };


    return (
        <div className='friend' key={props.inbox_id} onClick={handleInboxClick} style={{backgroundColor: props.inbox_id === props.inboxId ? "var(--clicked-chatbox-color)" : undefined}}>
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
