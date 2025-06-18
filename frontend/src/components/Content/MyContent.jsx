import './content.css';
import { convertDatetimeToShowTime } from '../../utils';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const MyContent = (props) => {
    return (
        <div className='my-content' key={props.id}>
            <div className="my-text-box">
                {props.text && <span className='my-message'>{props.text}</span>}
                <Zoom>
                    {props.attachment && <img src={props.attachment} alt="" className='my-attachment'/>}
                </Zoom>
                <span className='my-time'>{convertDatetimeToShowTime(props.created_at)}</span>
            </div>
        </div>
    );
};

export default MyContent;
