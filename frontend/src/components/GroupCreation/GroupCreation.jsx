import SearchIcon from '../../assets/icons/search.svg';
import { useEffect, useState } from 'react';
import handleHTTPRequest from '../../httpclient';
import config from '../../externals/config';
import { useNavigate } from 'react-router-dom';
import UserSuggestion from '../UserSuggestion/UserSuggestion';
import GroupMember from '../GroupMember/GroupMember';
import './GroupCreation.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import { toast } from 'react-toastify';



function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
}


const GroupCreation = (props) => {
    const [searchText, setSearchText] = useState('');
    const [suggestedUser, setSuggestedUser] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const debouncedSearchText = useDebounce(searchText, 500);
    const [hasMore, setHasMore] = useState(true);
    const [groupName, setGroupName] = useState('');

    const navigate = useNavigate();

    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    }

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const getSuggestedUsers = async(offset=0, limit=30, is_pagination=true) => {
        const url = config.inbox.get_users(props.user_id);
        const params = {
            search: searchText ? searchText : null,
            offset: is_pagination ? suggestedUser.length : offset,
            limit: limit
        }
        try{
            const response  = await handleHTTPRequest('GET', url, {}, params, null);
            if (response.status !== 200){
                console.log("Error: ", response.data);
                localStorage.clear();
                navigate("/")
            }
            else{
                if(!is_pagination){
                    setSuggestedUser(response.data.dataSource);
                    if(response.data.dataSource.length < limit){
                        setHasMore(false);
                    }
                }
                else{
                    setSuggestedUser((prevItems) => [
                        ...prevItems,
                        ...response.data.dataSource,
                    ]);

                    if(response.data.dataSource.length < limit){
                        setHasMore(false);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    }

    const getSuggestedUserComponents = () => {
        return suggestedUser.map((user) => (
            <UserSuggestion key={user.id} {...user} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} />
        ));
    };

    const handleCancelClick = () => {
        props.setIsCreateGroup(false)
        setSelectedMembers([]);
    }


    const handleCreateGroup = async() => {
        if(!groupName || selectedMembers.length < 2){
            return;
        }

        const url = config.inbox.create_group(props.user_id);
        const data = {
            inbox_name: groupName,
            inbox_members: selectedMembers.map(member => member.id),
        }
        try{
            const response = await handleHTTPRequest('POST', url, {}, null, data);
            if(response.status === 200){
                props.setIsCreateGroup(false);
                setSelectedMembers([]);
                setSelectedMembers([]);
                setSuggestedUser([]);
                toast.success(`Group: ${groupName} created successfully`);
                setGroupName('');
            }else{
                console.log("Error: ",response.data);
                localStorage.clear();
                navigate("/")
                toast.error("Group creation failed");
            }
        }catch(error){
            console.log("Error: ",error);
            toast.error("Group creation failed");
        }
    }

    useEffect(() => {
        getSuggestedUsers(0, 30, false);
    }, [debouncedSearchText]);


    return (
        <div className="group-creation-overlay">
            <div className='group-creation-container'>
                <input type="text" placeholder="Group Name" className="group-name" value={groupName} onChange={handleGroupNameChange}/>
                <div className='suggested-search'>
                    <img src={SearchIcon} alt="Search LOGO" width={25} height={25} className='search-icon'/>
                    <input type='search' placeholder='Search' className='suggested-user-search' value={searchText} onChange={handleSearchChange}/>
                </div>
                <div className="group-member-container">
                    {selectedMembers.map((member) => (
                        <GroupMember key={member.id} {...member} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers}/>
                    ))}
                </div>
                <div className="suggestion-container" id="scrollableUserSuggestionContainer">
                    <InfiniteScroll
                        key={props.inboxId}
                        dataLength={suggestedUser.length}
                        next={getSuggestedUsers}
                        hasMore={hasMore}
                        scrollableTarget="scrollableUserSuggestionContainer"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            height: '100%'
                        }}
                        className='chatlist-scroll'
                    >
                        {getSuggestedUserComponents()}
                    </InfiniteScroll>
                </div>
                <div className="button-container">
                    <button className='cancel-button' onClick={handleCancelClick}>Cancel</button>
                    <button className='create-button' onClick={handleCreateGroup} style={{background: selectedMembers.length < 2 || !groupName ? "white" : undefined, color: selectedMembers.length < 2 || !groupName ? "black" : undefined, cursor: selectedMembers.length < 2 || !groupName ? "not-allowed" : undefined}}>Create</button>
                </div>
            </div>
        </div>
    );
};

export default GroupCreation;
