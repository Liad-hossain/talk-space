import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import handleHTTPRequest from "../../httpclient";
import config from "../../externals/config";
import ProfileIcon from '../../assets/icons/profile_avatar.svg';
import './GroupDetails.css';
import { toast } from "react-toastify";
import Edit from '../../assets/images/edit.png';
import Check from '../../assets/images/check.png';
import AddIcon from '../../assets/images/add_icon.jpg';
import InboxMember from "../InboxMember/InboxMember";
import Exit from '../../assets/images/exit.png';
import AddMember from "../AddMember/AddMember";
import { selectedStates } from "../../const";


const MAX_LENGTH = 30;

const GroupDetails = (props) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [groupPhoto, setGroupPhoto] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [memberCount, setMemberCount] = useState(null);
    const [inboxMembers, setInboxMembers] = useState([]);
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isAddMemberClicked, setIsAddMemberClicked] = useState(false);
    const navigate = useNavigate();

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target.result);
                setGroupPhoto('');
            };
            reader.readAsDataURL(file);
            setSelectedImageFile(file);
        }
    };

    const fetch_group_details = async () => {
        try {
            const response = await handleHTTPRequest(
                "GET",
                config.inbox.get_group_details(props.inboxId),
                {},
                null,
                null
            );
            if (response.status === 200) {
                setGroupName(response.data.dataSource.inbox_name);
                setGroupPhoto(response.data.dataSource.group_photo);
                setMemberCount(response.data.dataSource.total_members);
                setInboxMembers(response.data.dataSource.inbox_members);
                if(response.data.dataSource.group_photo){
                    props.setInboxImage(response.data.dataSource.group_photo);
                }
            } else {
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/");
            }
            } catch (error) {
            console.log("Error: ", error);
            localStorage.clear();
            navigate("/");
        }
    };


    const handlePhotoUploadClick = async () =>{
        if(selectedImageFile.size >= 5 * 1024 * 1024){
            setSelectedImageFile(null);
            setSelectedImage(null);
            toast.error("Image size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("group_photo", selectedImageFile);
        try{
            const response = await handleHTTPRequest('POST', config.inbox.update_group_details(props.inboxId), {}, null, formData);
            if(response.status === 200){
                fetch_group_details();
                setSelectedImageFile(null);
                setSelectedImage(null);
                toast.success("Group photo uploaded successfully");
            }else{
                console.log("Error: ", response.data);
                setSelectedImageFile(null);
                setSelectedImage(null);
                toast.error("Couldn't upload image. Please try again.");
            }
        }catch(error){
            setSelectedImageFile(null);
            setSelectedImage(null);
            console.log("Error: ", error);
            toast.error("Couldn't upload image. Please try again.");
        }
    };

    const handleNameEditClick = () => {
        setIsEditingName(true);
        nameInputRef.current?.focus();
        nameInputRef.current.style.borderBottom = "1px solid #ccc";
    }


    const handleCheckClick = async(group_name) =>{
        try{
            const response = await handleHTTPRequest('POST', config.inbox.update_group_details(props.inboxId), {}, null, {"inbox_name": group_name});
            if(response.status === 200){
                setIsEditingName(false);
                nameInputRef.current.style.borderBottom = "none";
                props.setInboxName(group_name);
                toast.success("Group name updated successfully");
            }else{
                console.log("Error: ", response.data);
                toast.error("Couldn't update group name. Please try again.");
            }
        }catch(error){
            console.log("Error: ", error);
            toast.error("Couldn't update group name. Please try again.");
        }
    };

    const getInboxMemberComponents = () => {
        return inboxMembers.map((member) => (
            <InboxMember id={props.user_id} {...member} setReceiverId={props.setReceiverId} setIsUserDetailsClicked={props.setIsUserDetailsClicked} setIsGroupDetailsClicked={props.setIsGroupDetailsClicked}/>
        ))
    };


    useEffect(() => {
        fetch_group_details();
    }, [inboxMembers.length]);



    return (
        <div className='group-details-container'>
            {
                isAddMemberClicked &&
                <AddMember
                    isAddMemberClicked = {isAddMemberClicked}
                    setIsAddMemberClicked = {setIsAddMemberClicked}
                    members = {inboxMembers}
                    setMembers = {setInboxMembers}
                    inboxId = {props.inboxId}
                    user_id = {props.user_id}
                />
            }
            <div className="group-details-header-container">
                <h2 className="group-details-header">Group Info</h2>
                <span className="group-details-close-button" onClick={() => props.setIsGroupDetailsClicked(false)}>×</span>
            </div>
            <div className="group-photo-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <img src={selectedImage || groupPhoto || ProfileIcon} alt="" className="group-image-icon" width={80} height={80} onClick={handleImageClick}/>
                <div className="group-image-text" onClick={handleImageClick}>
                    <span>📸</span>
                    <span>{groupPhoto || selectedImage ? "Change Group Photo" : "Choose Group Photo"}</span>
                </div>
            </div>
            {selectedImage && <button className='group-upload-btn' onClick={handlePhotoUploadClick}>Upload</button>}
            <div className="group-name-container">
                <input type="text" ref={nameInputRef} value={groupName} readOnly={!isEditingName} onChange={(e) => setGroupName(e.target.value.slice(0, MAX_LENGTH))} className="group-name"/>
                {isEditingName && <span className="character-limit">{MAX_LENGTH}</span>}
                {!isEditingName && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handleNameEditClick}/>}
                {isEditingName && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick(groupName)}/>}
            </div>
            <span className="member-count">Group: {memberCount} Members</span>
            <span style={{borderBottom: "1px solid #ccc"}}></span>
            <div className="add-member-container" onClick={() => setIsAddMemberClicked(true)}>
                <img src={AddIcon} alt="" className="add-icon" width={40} height={40}/>
                <span className="add-members">Add Member</span>
            </div>
            {getInboxMemberComponents()}
            <div className="exit-group-button-container">
                <img src={Exit} alt="" className="exit-icon" width={20} height={20}/>
                <span className="exit-group" onClick={()=>props.setIsExitGroup(true)}>Exit Group</span>
            </div>
        </div>
    );
};

export default GroupDetails;
