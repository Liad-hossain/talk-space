import './AddMember.css';
import config from '../../externals/config';
import handleHTTPRequest from '../../httpclient';
import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import UserSuggestion from '../UserSuggestion/UserSuggestion';
import SearchIcon from '../../assets/icons/search.svg';
import GroupMember from '../GroupMember/GroupMember';
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


const AddMember = (props) => {
    const [searchText, setSearchText] = useState('');
    const [userList, setUserList] = useState([]);
    const [selectedAddMembers, setSelectedAddMembers] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const debouncedSearchText = useDebounce(searchText, 500);


    const get_user_list = async(offset=0, limit=30, is_pagination=true) => {
        const url = config.inbox.get_users(props.user_id);
        const params = {
            search: searchText ? searchText : null,
            offset: is_pagination ? userList.length : offset,
            limit: limit
        }
        try{
            const response  = await handleHTTPRequest('GET', url, {}, params, null);
            if (response.status !== 200){
                console.log("Error: ", response.data);
                localStorage.clear();
            }
            else{
                if(!is_pagination){
                    setUserList(response.data.dataSource);
                    if(response.data.dataSource.length < limit){
                        setHasMore(false);
                    }
                }
                else{
                    setUserList((prevItems) => [
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

    const get_user_components = () => {
        return userList.map((user) => {
            return (
                <UserSuggestion key={user.id} {...user} selectedMembers={selectedAddMembers} setSelectedMembers={setSelectedAddMembers} members={props.members}/>
            );
        });
    }

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };


    const handleAddMember = async() =>{
        if(selectedAddMembers.length <= 0){
            return;
        }

        const url = config.inbox.add_member(props.inboxId);
        const params = {
            user_ids: selectedAddMembers.map(member => member.id),
        }
        console.log("params: ", params);
        try{
            const response = await handleHTTPRequest('POST', url, {}, params, {});
            if(response.status === 200){
                setSelectedAddMembers([]);
                setUserList([]);
                props.setMembers(prevItems => [...prevItems, ...selectedAddMembers]);
                toast.success("Members added successfully");
                props.setIsAddMemberClicked(false);
            }else{
                console.log("Error: ",response.data);
                localStorage.clear();
                toast.error("Couldn't add members. Please try again later.");
            }
        }catch(error){
            console.log("Error: ",error);
            toast.error("Couldn't add members. Please try again later.");
        }
    };

    useEffect(() => {
        get_user_list(0, 30, false);
    }, [debouncedSearchText]);


    return (
        <div className='add-member-select-overlay'>
            <div className="add-member-select-container">
                <div className='suggested-search'>
                    <img src={SearchIcon} alt="Search LOGO" width={25} height={25} className='search-icon'/>
                    <input type='search' placeholder='Search' className='suggested-user-search' value={searchText} onChange={handleSearchChange}/>
                </div>
                <div className="group-member-container">
                    {selectedAddMembers.map((member) => (
                        <GroupMember key={member.id} {...member} selectedMembers={selectedAddMembers} setSelectedMembers={setSelectedAddMembers}/>
                    ))}
                </div>
                <InfiniteScroll
                        key={props.inboxId}
                        dataLength={userList.length}
                        next={get_user_list}
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
                        {get_user_components()}
                </InfiniteScroll>
                <div className="add-member-button-container">
                    <button className='add-member-cancel-button' onClick={() => props.setIsAddMemberClicked(false)}>Cancel</button>
                    <button className='add-member-add-button' onClick={handleAddMember} style={{background: selectedAddMembers.length === 0 ? "white" : undefined, color: selectedAddMembers.length === 0 ? "black" : undefined, cursor: selectedAddMembers.length === 0 ? "not-allowed" : undefined}}>Add</button>
                </div>
            </div>
        </div>
    );
};

export default AddMember;
