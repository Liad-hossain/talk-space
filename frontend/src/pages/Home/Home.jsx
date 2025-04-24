import { useState } from 'react';
import './Home.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import Login from '../../components/Login/Login';
import Register from '../../components/Register/Register';
import {userStates} from '../../const';

const Home = () => {
    const [user_state, setUserState] = useState(userStates.LOGIN);

    return (
        <div className='home'>
            <div className="left-home">
                <h1 className='home-title'>Share Your Thoughts</h1>
                <img src={talkspace_logo} alt="My LOGO" width={200} height={200}/>
            </div>
            <div className="right-home">
                {user_state === userStates.LOGIN ? <Login setUserState={setUserState}/> : <Register setUserState={setUserState}/>}
            </div>
        </div>
    );
};

export default Home;
