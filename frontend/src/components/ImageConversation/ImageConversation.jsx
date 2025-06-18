import './ImageConversation.css';

const ImageConversation = (props) => {
    const handleCancelClick = () => {
        props.setSelectedImage(null);
        props.setSelectedImageFile(null);
    }


    return (
        <div className="image-sending-overlay">
            <div className='image-seding-container'>
                <div className="selected-image-container">
                    <img src={props.selectedImage} alt="" className='selected-image' />
                </div>
                <div className="image-conversation-btns">
                    <button className='image-cancel-button' onClick={handleCancelClick}>Cancel</button>
                    <button className='image-send-button' onClick={props.handleSendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ImageConversation;
