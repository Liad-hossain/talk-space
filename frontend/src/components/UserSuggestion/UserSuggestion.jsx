import React from 'react';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import './UserSuggestion.css';


const UserSuggestion = (props) => {
    const handleUserSuggestionClick = (event) => {
        if(alreadyAdded){
            return;
        }

        const selectItem = event.currentTarget.querySelector('.select-item');
        if (selectItem){
            if (selectItem.classList.contains('disabled')) {
                return;
            }
            selectItem.classList.toggle('selected');
        }
        else{
            console.log("SelectItem not found.")
        }

        const is_selected = selectItem.classList.contains('selected');

        const data = {
            id: props.id,
            first_name: props.first_name,
            username: props.username,
            is_active: props.is_active,
            profile_photo: props.profile_photo,
            select_item: selectItem,
        }

        if (is_selected){
            props.setSelectedMembers((prevItems) => [
                ...prevItems,
                data,
            ]);
        }
        else{
            props.setSelectedMembers((prevItems) => prevItems.filter(item => item.first_name !== props.first_name));
        }
    }

    const isSelected = props.selectedMembers.some(item => item.id === props.id);

    let alreadyAdded = false;
    if(props.members){
        alreadyAdded = props.members.some(item => item.user_id === props.id);
    }


    return (
        <div className='suggested-user' key={props.id} onClick={handleUserSuggestionClick}>
            <div className="suggested-user-profile-container">
                <img src={props.profile_photo ||ProfileIcon} alt="My Profile" width={50} height={50} className='suggested-user-profile'/>
                {props.is_active  &&  <div className="active-status-suggestion"></div>}
            </div>
            <div className="inbox-name-container">
                <span className='inbox-name'>{props.inbox_name || props.username}</span>
                {alreadyAdded && <span className='already-added'>Already added to the group</span>}
            </div>
            <div className={`select-item ${isSelected || alreadyAdded ? 'selected' : ''}`} data-value={props.id}>
                <div className="tick-button"></div>
            </div>
        </div>
    );
};

export default UserSuggestion;
