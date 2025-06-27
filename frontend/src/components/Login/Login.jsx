import './Login.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import {userStates} from '../../const';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import config from '../../externals/config';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Using react-icons
import { useState } from 'react';


const Login = (props) => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

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
                localStorage.setItem('access_token', response.data.dataSource.access_token);
                localStorage.setItem('refresh_token', response.data.dataSource.refresh_token);

                toast.success('Logged in successfully!!');
                navigate('/chat', {state: {user_id: response.data.dataSource.id}});
            }
            else{
                toast.error(response?.data.error || "Login failed");
                console.log('Error:', response.data);
            }
        } catch (error) {
            toast.error(error.response?.data.error || "Login failed");
            console.error('Error:', error);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className='login'>
            <img src={talkspace_logo} alt="My LOGO" width={150} height={150}/>
            <h2>Sign in to your account</h2>
            <form className='login-form' onSubmit={handleLogin}>
                <input type='username' placeholder='Username' className='form-input' required/>
                <div className='form-password' >
                    <input type={showPassword ? "text" : "password"} placeholder='Password' className='password-input-container' required/>
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                <button type='submit' className='form-button'>Sign In</button>
            </form>
            <p>Don't have an account? <span onClick={()=>props.setUserState(userStates.REGISTER)}>Sign up here</span></p>
        </div>
    );
};

export default Login;
