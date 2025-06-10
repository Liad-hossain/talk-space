import './Account.css';
import AddProfileImage from '../../assets/images/add_profile_image.jpg';
import Edit from '../../assets/images/edit.png';
import Check from '../../assets/images/check.png';
import Logout from '../../assets/images/logout.jpg';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../externals/config';
import { toast } from 'react-toastify';
import handleHTTPRequest from '../../httpclient';


const MAX_LENGTH =30;

const Account = (props) => {
    const [username, setUsername] = useState('');
    const [profilePhoto, setProfilePhoto] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const navigate = useNavigate();

    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const nameInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const phoneNumberInputRef = useRef(null);
    const cityInputRef = useRef(null);
    const countryInputRef = useRef(null);


    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [isEditingCity, setIsEditingCity] = useState(false);
    const [isEditingCountry, setIsEditingCountry] = useState(false);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target.result);
                setProfilePhoto('');
            };
            reader.readAsDataURL(file);
            setSelectedImageFile(file);
        }
    };


    const handlePhotoSaveClick = async() => {
        if(selectedImageFile.size >= 5 * 1024 * 1024){
            setSelectedImageFile(null);
            setSelectedImage(null);
            toast.error("Image size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedImageFile);
        try{
            const response = await handleHTTPRequest('POST', config.auth.update_profile(props.user_id), {}, null, formData);
            if(response.status === 200){
                get_profile_data();
                setSelectedImageFile(null);
                setSelectedImage(null);
                toast.success("Profile photo uploaded successfully");
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
    }


    const handleNameEditClick = () => {
        setIsEditingName(true);
        nameInputRef.current?.focus();
        nameInputRef.current.style.borderBottom = "1px solid #ccc";
    }

    const handleEmailClick = () => {
        setIsEditingEmail(true);
        emailInputRef.current?.focus();
    }

    const handlePhoneNumberClick = () => {
        setIsEditingPhoneNumber(true);
        phoneNumberInputRef.current?.focus();
    }

    const handleCityClick = () => {
        setIsEditingCity(true);
        cityInputRef.current?.focus();
    }


    const handleCountryClick = () => {
        setIsEditingCountry(true);
        countryInputRef.current?.focus();
    }


    const handleCheckClick = async(key, value) => {
        try{
            const data = {
                [key]: value,
            }

            const response = await handleHTTPRequest('POST', config.auth.update_profile(props.user_id), {}, null, data);
            if(response.status === 200){
                setIsEditingName(false);
                setIsEditingEmail(false);
                setIsEditingPhoneNumber(false);
                setIsEditingCity(false);
                setIsEditingCountry(false);
                get_profile_data();
                toast.success("Profile updated successfully");
            }else{
                console.log("Error: ", response.data);
                toast.error("Couldn't update profile. Please try again.");
            }
        }catch(error){
            console.log("Error: ", error);
            toast.error("Couldn't update profile. Please try again.");
        }
    }

    const handleBackButtonClick = () => {
        props.setIsOpenAccount(false);
    }

    const logout = async() => {
        try {
            const headers = {
                'Authorization': `Token ${localStorage.getItem('access_token')}`
            }
            const response = await axios.post(config.auth.logout(), null, {headers});
            if (response.status === 200) {
                localStorage.clear();
                toast.success("Logged out successfully");
                navigate('/')
            }
            else{
                toast.error("Error Response but logged out");
                localStorage.clear();
                navigate('/')
            }
        } catch (error) {
            toast.error("Error Response but logged out");
            localStorage.clear();
            navigate('/')
        }
    }

    const get_profile_data = async() =>{
        try{
            const response = await handleHTTPRequest('GET', config.auth.get_profile(props.user_id), {}, null, null);
            if(response.status === 200){
                setUsername(response.data.dataSource.username);
                setProfilePhoto(response.data.dataSource.profile_photo);
                setEmail(response.data.dataSource.email);
                setPhoneNumber(response.data.dataSource.phone_number);
                setCity(response.data.dataSource.city);
                setCountry(response.data.dataSource.country);
            }else{
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/")
        }
        }catch(error){
            console.log("Error: ", error);
            localStorage.clear();
            navigate("/")
        }
    }


    useEffect(() => {
        get_profile_data();
    }, []);


    return (
        <div className="account-container">
            <span className="account-header">Profile</span>
            <div className="add-image-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <img src={profilePhoto || selectedImage || AddProfileImage} alt="" className="add-img-icon" width={80} height={80} onClick={handleImageClick}/>
                <span className='add-image-text'>{selectedImageFile || profilePhoto ? "Change Profile Photo" : "Add Profile Photo"}</span>
                {selectedImage && <button className='profile-save-btn' onClick={handlePhotoSaveClick}>Save</button>}
            </div>
            <div className="account-name-container">
                <span className="username-label">Your Username</span>
                <div className="username-box">
                    <input type="text" ref={nameInputRef} value={username} readOnly={!isEditingName} onChange={(e) => setUsername(e.target.value.slice(0, MAX_LENGTH))} className="account-name"/>
                    {isEditingName && <span className="character-limit">{MAX_LENGTH}</span>}
                    {!isEditingName && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handleNameEditClick}/>}
                    {isEditingName && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick("username", username)}/>}
                </div>
            </div>
            <div className="account-email-container">
                <span className="email-label">Your Email</span>
                <div className="email-box">
                    <input type="text" ref={emailInputRef} value={email} readOnly={!isEditingEmail} onChange={(e) => setEmail(e.target.value.slice(0, MAX_LENGTH))} className="email-name"/>
                    {isEditingEmail && <span className="character-limit">{MAX_LENGTH}</span>}
                    {!isEditingEmail && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handleEmailClick}/>}
                    {isEditingEmail && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick("email", email)}/>}
                </div>
            </div>
            <div className="account-phone-container">
                <span className="phone-label">Your Phone Number</span>
                <div className="phone-box">
                    <input type="text" ref={phoneNumberInputRef} value={phoneNumber} readOnly={!isEditingPhoneNumber} onChange={(e) => setPhoneNumber(e.target.value.slice(0, MAX_LENGTH))} className="phone-number"/>
                    {isEditingPhoneNumber && <span className="character-limit">{MAX_LENGTH}</span>}
                    {!isEditingPhoneNumber && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handlePhoneNumberClick}/>}
                    {isEditingPhoneNumber && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick("phone_number", phoneNumber)}/>}
                </div>
            </div>
            <div className="account-city-container">
                <span className="city-label">Your City</span>
                <div className="city-box">
                    <input type="text" ref={cityInputRef} value={city} readOnly={!isEditingCity} onChange={(e) => setCity(e.target.value.slice(0, MAX_LENGTH))} className="city-name"/>
                    {isEditingCity && <span className="character-limit">{MAX_LENGTH}</span>}
                    {!isEditingCity && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handleCityClick}/>}
                    {isEditingCity && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick("city", city)}/>}
                </div>
            </div>
            <div className="account-country-container">
                <span className="country-label">Your Country</span>
                <div className="country-box">
                    <input type="text" ref={countryInputRef} value={country} readOnly={!isEditingCountry} onChange={(e) => setCountry(e.target.value.slice(0, MAX_LENGTH))} className="country-name"/>
                    {isEditingCountry && <span className="character-limit">{MAX_LENGTH}</span>}
                    {!isEditingCountry && <img src={Edit} alt="" className="edit-icon" width={40} height={40} style={{cursor: "pointer"}} onClick={handleCountryClick}/>}
                    {isEditingCountry && <img src={Check} alt="" className="check-icon" width={30} height={30} style={{cursor: "pointer"}} onClick={() => handleCheckClick("country", country)}/>}
                </div>
            </div>
            <div className="logout-container" onClick={logout}>
                <img src={Logout} alt="" className="logout-icon" width={40} height={40}/>
                <span className="logout">Logout</span>
            </div>
            <button className='back-button' onClick={handleBackButtonClick}>Back</button>
        </div>
    );
};

export default Account;
