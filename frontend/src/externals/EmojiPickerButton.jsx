import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './EmojiPickerButton.css';


const EmojiPickerButton = ({ onEmojiClick }) => {
  const [showPicker, setShowPicker] = useState(false);

  const togglePicker = (e) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Prevent event bubbling
    setShowPicker(!showPicker)
};

  return (
    <div className="emoji-picker-container">
      <button
        type="button"
        onClick={togglePicker}
        className="emoji-trigger"
      >
        😊
      </button>

      {showPicker && (
        <div className="emoji-picker-wrapper">
          <EmojiPicker
            onEmojiClick={(emojiData, event) => {
              onEmojiClick(emojiData.emoji, event);
              setShowPicker(false);
            }}
            width={300}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;
