import './Register.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import {userStates, TALKSPACE_BACKEND_BASE_URL} from '../../const';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';


const Register = (props) => {
    const navigate = useNavigate();

    const handleRegister = async(e) => {
        e.preventDefault();
        const data = {
            username: e.target[0].value,
            email: e.target[1].value,
            password: e.target[2].value,
            city: (e.target[3].value ? e.target[3].value : ""),
            country: (e.target[4].value ? e.target[4].value : "")
        }

        try {
            const response = await axios.post(`${TALKSPACE_BACKEND_BASE_URL}/api/accounts/register`, data);

            if (response.status === 200) {
                console.log('Success: ', response.data);
                navigate('/chat')
            }
            else{
                console.log('Error: ', response.data);
            }

        } catch (error) {
            console.log('Error: ', error);
        }
    }
    return (
        <div className='register'>
            <img src={talkspace_logo} alt="My LOGO" width={150} height={150}/>
            <h2>Create a new account</h2>
            <form className='register-form' onSubmit={handleRegister}>
                <input type='username' placeholder='Username' className='form-input' required/>
                <input type='email' placeholder='Email' className='form-input' required/>
                <input type='password' placeholder='Password' className='form-input' required/>
                <input type='city' placeholder='City' className='form-input'/>
                <input type='country' placeholder='Country' className='form-input'/>
                <button type='submit' className='form-button'>Sign Up</button>
            </form>
            <p>Already have an account? <span onClick={()=>props.setUserState(userStates.LOGIN)}>Sign in here</span></p>
        </div>
    );
};

export default Register;
