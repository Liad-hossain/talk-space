import './Friend.css';
import Profile from '../../assets/icons/profile_avatar.svg';
import '../../index.css'


const Friend = (props) => {

    return (
        <div className='friend' key={props.chatId} onClick={()=>props.setChatId(props.id)} style={{backgroundColor: props.id === props.chatId ? "var(--clicked-chatbox-color)" : undefined}}>
            <img src={Profile} alt="My Profile" width={50} height={50} className='friend-profile'/>
            <div className="content">
                <span className='friend-name'>{props.name}</span>
                <span className='friend-text'>{props.text}</span>
            </div>
            <div className="friend-history">
                <span className='last-send-time'>{props.last_send_time}</span>
                {props.unread_text_count > 0 && <span className='friend-unread'>{props.unread_text_count}</span>}
            </div>
        </div>
    );
};

export default Friend;
