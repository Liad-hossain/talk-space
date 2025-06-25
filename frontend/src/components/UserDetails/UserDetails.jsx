import ProfileIcon from "../../assets/icons/profile_avatar.svg";
import handleHTTPRequest from "../../httpclient";
import config from "../../externals/config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './UserDetails.css';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';


const UserDetails = (props) => {
  const [profileDetails, setProfileDetails] = useState({});
  const navigate = useNavigate();

  const fetch_profile_data = async () => {
    try {
      const response = await handleHTTPRequest(
        "GET",
        config.auth.get_profile(props.receiver_id),
        {},
        null,
        null
      );
      if (response.status === 200) {
        setProfileDetails(response.data.dataSource);
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

  fetch_profile_data();

  return (
    <div className="user-details-container">
      <div className="user-details-header-container">
        <h2 className="user-details-header">Profile</h2>
        <span className="user-details-close-button" onClick={() => props.setIsUserDetailsClicked(false)}>×</span>
      </div>
      <div className="user-profile-container">
        <Zoom>
          <img
            src={profileDetails.profile_photo || ProfileIcon}
            alt=""
            className="user-details-image"
          />
        </Zoom>
        <h3 className="user-details-name">{profileDetails.username}</h3>
      </div>
      <div className="user-details-contact">
        <h4>Contact Information</h4>
        {
          profileDetails.email &&
          <div className="user-email-container">
            <span className="user-email-label">Email Address</span>
            <span className="user-email-box">{profileDetails.email}</span>
          </div>
        }
        {
          profileDetails.phone_number &&
          <div className="user-phone-container">
            <span className="user-phone-label">Phone Number</span>
            <span className="user-phone-box">{profileDetails.phone_number}</span>
          </div>
        }
        {
          profileDetails.city &&
          <div className="user-city-container">
            <span className="user-city-label">City Name</span>
            <span className="user-city-box">{profileDetails.city}</span>
          </div>
        }
        {
          profileDetails.country &&
          <div className="user-country-container">
            <span className="user-country-label">Country Name</span>
            <span className="user-country-box">{profileDetails.country}</span>
          </div>
        }
      </div>
    </div>
  );
};

export default UserDetails;
