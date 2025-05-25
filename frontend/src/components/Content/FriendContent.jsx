import './content.css';
import Profile from '../../assets/icons/profile_avatar.svg';
import { convertDatetimeToShowTime } from '../../utils';


const FriendContent = (props) => {
    return (
        <div className='friend-content' key={props.id}>
            <img src={Profile} alt="Friend Profile" width={50} height={50} className='friend-photo'/>
            <div className="friend-text-box">
                <span className='friend-text'>{props.text}</span>
                <span className='friend-time'>{convertDatetimeToShowTime(props.created_at)}</span>
            </div>
        </div>
    );
};

export default FriendContent;
