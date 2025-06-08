import React from 'react';
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import './UserSuggestion.css';


const UserSuggestion = (props) => {
    const handleUserSuggestionClick = (event) => {
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
            is_active: props.is_active,
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


    return (
        <div className='suggested-user' key={props.id} onClick={handleUserSuggestionClick}>
            <div className="suggested-user-profile-container">
                <img src={ProfileIcon} alt="My Profile" width={50} height={50} className='suggested-user-profile'/>
                {props.is_active  &&  <div className="active-status-suggestion"></div>}
            </div>
            <span className='inbox-name'>{props.inbox_name || props.username}</span>
            <div className={`select-item ${isSelected ? 'selected' : ''}`} data-value={props.id}>
                <div className="tick-button"></div>
            </div>
        </div>
    );
};

export default UserSuggestion;
