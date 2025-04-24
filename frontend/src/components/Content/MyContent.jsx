import './content.css';
import Profile from '../../assets/icons/profile_avatar.svg';

const MyContent = (props) => {
    return (
        <div className='my-content' key={props.id}>
            <div className="my-text-box">
                <span className='my-text'>{props.text}</span>
                <span className='my-time'>{props.time}</span>
            </div>
            <img src={Profile} alt="My Profile" width={50} height={50} className='my-photo'/>
        </div>
    );
};

export default MyContent;
