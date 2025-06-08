import './content.css';
import { convertDatetimeToShowTime } from '../../utils';


const MyContent = (props) => {
    return (
        <div className='my-content' key={props.id}>
            <div className="my-text-box">
                <span className='my-message'>{props.text}</span>
                <span className='my-time'>{convertDatetimeToShowTime(props.created_at)}</span>
            </div>
        </div>
    );
};

export default MyContent;
