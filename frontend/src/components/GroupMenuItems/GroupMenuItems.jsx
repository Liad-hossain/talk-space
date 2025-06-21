import './GroupMenuItems.css';


const GroupMenuItems = (props) => {

    const handleGroupInfoClick = async() => {
        props.setOpenMenu(false);
        props.setIsGroupDetailsClicked(true);
    }

    return (
        <div className='group-menu-items-container'>
            <span className="group-menu-items" onClick={handleGroupInfoClick}>Group Info</span>
            <span className="group-menu-items" onClick={()=>{props.setOpenMenu(false); props.setIsClearChat(true);}}>Clear Chat</span>
            <span className="group-menu-items" onClick={()=>{props.setOpenMenu(false); props.setIsExitGroup(true);}}>Exit Group</span>
        </div>
    );
};

export default GroupMenuItems;
