import './GroupMember.css';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';


const GroupMember = (props) => {

    const handleCrossButton = () => {
        props.setSelectedMembers((prevItems) => prevItems.filter(item => item.id !== props.id));
        props.select_item.classList.toggle('selected');
    }


    return (
        <div className='group-member'>
            <div className="member-img-container">
                <div className="cross-button" onClick={handleCrossButton}>⨯</div>
                <img src={props.profile_photo || ProfileIcon} alt="" className="group-member-img" />
                {props.is_active  &&  <div className="active-status-suggestion"></div>}
            </div>
            <span className='group-member-name'>{props.first_name}</span>
        </div>
    );
};

export default GroupMember;
