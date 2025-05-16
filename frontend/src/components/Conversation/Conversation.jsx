import './Conversation.css';
import MyContent from '../Content/MyContent';
import FrienContent from '../Content/FriendContent';
import { contentSources } from '../../const';
import Profile from '../../assets/icons/profile_avatar.svg';
import SmileIcon from '../../assets/icons/smile_icon.svg'
import SendIcon from '../../assets/icons/send_icon.svg';
import ThreeDots from '../../assets/icons/three_dots.svg';
import axios from 'axios';
import config from '../../externals/config';


const getContents = (user_id) => {

    const contents = {
        user_name: "John Doe",
        is_active: true,
        conversation_list: [
            {
                id: 7,
                source: contentSources.ADMIN,
                text: "No, it's fine. We can meet at your place.",
                time: "10:36 pm"
            },
            {
                id: 9,
                source: contentSources.FRIEND,
                text: "If you have any other preferences, let me know. Actually I don't know about many wonderful place in Dhaka. It'll be a pleasure to meet you. I'm looking forward to meet you.",
                time: "10:35 pm"
            },
            {
                id: 8,
                source: contentSources.FRIEND,
                text: "Uttara, sector 7?",
                time: "10:35 pm"
            },
            {
                id: 7,
                source: contentSources.ADMIN,
                text: "My Pleasure. Where to meet?",
                time: "10:35 pm"
            },
            {
                id: 6,
                source: contentSources.FRIEND,
                text: "Sure. Why not? Let's meet on Sunday at 10 am.",
                time: "10:34 pm"
            },
            {
                id: 5,
                source: contentSources.ADMIN,
                text: "It's very long time we haven't talked, let's have a meet together. Do you want to do it? We can meet somewhere outside. You can suggest time and place.",
                time: "10:33 pm"
            },
            {
                id: 4,
                source: contentSources.FRIEND,
                text: "Yeah, going well.",
                time: "10:32 pm"
            },
            {
                id: 3,
                source: contentSources.ADMIN,
                text: "I'm fine, what about you?",
                time: "10:31 pm"
            },
            {
                id: 2,
                source: contentSources.FRIEND,
                text: "Hi, how are you?",
                time: "10:31 pm"
            },
            {
                id: 1,
                source: contentSources.ADMIN,
                text: "Hello",
                time: "10:30 pm"
            },
        ]
    }

    return contents
}


const getConversations = (conversation_list) =>{
    return conversation_list.map((conversation) => {
        if(conversation.source === contentSources.ADMIN){
            return <MyContent {...conversation}/>
        }else{
            return <FrienContent {...conversation}/>
        }
    })
}


const Conversation = (props) => {
    const contents = getContents(props.chatId);
    const handleSendMessage = async(e) => {
        e.preventDefault();
        const message = e.target.message.value
        e.target.message.value = "";
        if(!message){
            console.log("Message is empty. So not sending.");
            return;
        }

        try{
            const data = {
                id: 2,
                name: contents.user_name,
                text: message,
                last_send_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase(),
                unread_text_count: 0,
            }
            const response = await axios.post(
                config.chat.send_message(props.chatId),
                data,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${props.access_token}`
                    }
                }
            );
            if(response.status !== 200){
                console.log("Error: ", response.data);
            }
        }catch(error){
            console.log("Error: ", error);
        }
    }

    return (
        <div className='conversation'>
            <div className="conversation-top">
                <img src={Profile} alt="My Profile" width={50} height={50} className='conversation-profile'/>
                <div className="user-status">
                    <span className='user-name'>{contents.user_name}</span>
                    <span className='user-status-text'>Active now</span>
                </div>
                <img src={ThreeDots} alt='Three Dots Icon' width={50} height={50} className='three-dots-icon'/>
            </div>
            <div className="conversation-bottom">
                <div className='conversation-content'>
                    {getConversations(contents.conversation_list)}
                </div>
                <form className="send-box" onSubmit={handleSendMessage}>
                    <img src={SmileIcon} alt='Smile Icon' width={25} height={25} className='smile-icon'/>
                    <input type='text' name='message' placeholder='Type a message here...' className='text-input'/>
                    <button type='submit' className='send-icon-button'>
                        <img src={SendIcon} alt='Send Icon' width={30} height={30} className='send-icon'/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;
