import './content.css';
import Profile from '../../assets/icons/profile_avatar.svg';
import { convertDatetimeToShowTime } from '../../utils';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';


const FriendContent = (props) => {

    return (
        <div className='friend-content' key={props.id}>
            <div className="friend-conversation-image-container">
                <img src={props.sender_profile_photo || Profile} alt="Friend Profile" className='friend-photo'/>
                {props.sender_status === "active" && <div className="friend-active-status"></div>}
            </div>
            <div className="friend-message-box">
                <span className="content-friend-name">{props.isGroup ? props.sender_name: null}</span>
                <div className="friend-text-box">
                    {props.text && <span className='friend-message'>{props.text}</span>}
                    <Zoom>
                        {props.attachment && <img src={props.attachment} alt="" className='friend-attachment'/>}
                    </Zoom>
                    <span className='friend-time'>{convertDatetimeToShowTime(props.created_at)}</span>
                </div>
            </div>
        </div>
    );
};

export default FriendContent;
