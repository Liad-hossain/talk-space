import './ChatList.css';
import Friend from '../Friend/Friend'

const getFriendsChat = (props) => {
    const fiendList = [
        {
            id: 1,
            name: 'John Doe',
            text: 'Hello',
            last_send_time: '10:30 pm',
            unread_text_count: '2'
        },
        {
            id: 2,
            name: 'Alice',
            text: 'Good Morning',
            last_send_time: '06:00 am',
            unread_text_count: '1'
        },
        {
            id: 3,
            name: 'Bob',
            text: 'Good night',
            last_send_time: '12:00 pm',
            unread_text_count: '3'
        },
        {
            id: 4,
            name: 'John Doe',
            text: 'Hello',
            last_send_time: '10:30 pm',
            unread_text_count: '2'
        },
        {
            id: 5,
            name: 'Alice',
            text: 'Good Morning',
            last_send_time: '06:00 am',
            unread_text_count: '1'
        },
        {
            id: 6,
            name: 'Bob',
            text: 'Good night',
            last_send_time: '12:00 pm',
            unread_text_count: '3'
        },
        {
            id: 7,
            name: 'John Doe',
            text: 'Hello',
            last_send_time: '10:30 pm',
            unread_text_count: '2'
        },
        {
            id: 8,
            name: 'Alice',
            text: 'Good Morning',
            last_send_time: '06:00 am',
            unread_text_count: '1'
        },
        {
            id: 9,
            name: 'Bob',
            text: 'Good night',
            last_send_time: '12:00 pm',
            unread_text_count: '3'
        },
        {
            id: 10,
            name: 'John Doe',
            text: 'Hello',
            last_send_time: '10:30 pm',
            unread_text_count: '2'
        },
        {
            id: 11,
            name: 'Bob',
            text: 'Good night',
            last_send_time: '12:00 pm',
            unread_text_count: '3'
        },
        {
            id: 12,
            name: 'John Doe',
            text: 'Hello',
            last_send_time: '10:30 pm',
            unread_text_count: '2'
        }
    ]

    return fiendList.map((friend) => {
        return <Friend {...friend} userId = {props.userId} setUserId = {props.setUserId}/>
    });
}

const ChatList = (props) => {
    return (
        <div className='chat-list'>
            {getFriendsChat(props)}
        </div>
    );
};

export default ChatList;
