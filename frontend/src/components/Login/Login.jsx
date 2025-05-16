import './Login.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import {userStates} from '../../const';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../../externals/config';


const Login = (props) => {
    const navigate = useNavigate();

    const handleLogin = async(e) => {
        e.preventDefault();
        const data = {
            username: e.target[0].value,
            password: e.target[1].value
        }

        try {
            const response = await axios.post(config.auth.login(), data);
            if (response.status === 200) {
                console.log('Success:', response.data);
                navigate('/chat', {state: {user_id: response.data.data.id, access_token: response.data.data.access_token, refresh_token: response.data.data.refresh_token}});
            }
            else{
                console.log('Error:', response.data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div className='login'>
            <img src={talkspace_logo} alt="My LOGO" width={150} height={150}/>
            <h2>Sign in to your account</h2>
            <form className='login-form' onSubmit={handleLogin}>
                <input type='username' placeholder='Username' className='form-input' required/>
                <input type='password' placeholder='Password' className='form-input' required/>
                <button type='submit' className='form-button'>Sign In</button>
            </form>api/accounts/check-health
            <p>Don't have an account? <span onClick={()=>props.setUserState(userStates.REGISTER)}>Sign up here</span></p>
        </div>
    );
};

export default Login;
