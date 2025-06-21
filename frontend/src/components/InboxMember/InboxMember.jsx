import './InboxMember.css';

const InboxMember = (props) => {

    const handleMemberClick = () => {
        props.setReceiverId(props.user_id);
        props.setIsUserDetailsClicked(true);
        props.setIsGroupDetailsClicked(false);
    }

    return (
        <div className='inbox-member-container' onClick={handleMemberClick}>
            <img src={props.profile_photo} alt="" width={40} height={40} className='inbox-member-image'/>
            <span className="inbox-member-name">{props.id === props.user_id ? "You" : props.username}</span>
        </div>
    );
};

export default InboxMember;
