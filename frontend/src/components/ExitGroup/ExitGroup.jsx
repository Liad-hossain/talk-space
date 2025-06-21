import './ExitGroup.css';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { selectedStates } from '../../const';
import { toast } from 'react-toastify';


const ExitGroup = (props) => {

    console.log("User Id: ", props.user_id);
    const handleExitClick = async() => {
        try{
            const response = await handleHTTPRequest('POST', config.inbox.exit_group(props.inboxId, props.user_id), {}, null, {});
            if(response.status === 200){
                if(props.currentState === selectedStates.GROUPS){
                    props.setUserList(previtems => previtems.filter(item => item.inbox_id !== props.inboxId));
                }else{
                    props.setFriendList(previtems => previtems.filter(item => item.inbox_id !== props.inboxId));
                }
                props.setIsGroupDetailsClicked(false);
                props.setInboxId(null);
                props.setIsExitGroup(false);
                toast.success("You have left the group");
            }else{
                console.log("Error: ", response.data);
                toast.error("Couldn't exit group. Please try again.");
            }
        }catch(error){
            console.log("Error: ", error);
            toast.error("Couldn't exit group. Please try again.");
        }
    }


    return (
        <div className="exit-group-overlay">
            <div className='exit-group-container'>
                <span className="exit-group-header">Exit Group?</span>
                <span className="exit-group-desc">You will be removed from the group.</span>
                <div className="exit-button-container">
                    <button className='exit-group-cancel' onClick={()=>props.setIsExitGroup(false)}>Cancel</button>
                    <button className='exit-group-confirm' onClick={handleExitClick}>Exit</button>
                </div>
            </div>
        </div>
    );
};

export default ExitGroup;
