import './Register.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import {userStates} from '../../const';
import axios from 'axios';
import config from '../../externals/config';


const Register = (props) => {

    const handleRegister = async(e) => {
        e.preventDefault();
        if (e.target[2].value !== e.target[3].value){
            console.log("Passwords do not match");
            return;
        }

        const data = {
            username: e.target[0].value,
            email: e.target[1].value,
            password: e.target[2].value,
            city: (e.target[4].value ? e.target[4].value : ""),
            country: (e.target[5].value ? e.target[5].value : "")
        }

        try {
            const response = await axios.post(config.auth.register(), data);

            if (response.status === 200) {
                e.target.reset();
                console.log('Success: ', response.data);
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
                <input type='password' placeholder='Confirm Password' className='form-input' required/>
                <input type='city' placeholder='City' className='form-input'/>
                <input type='country' placeholder='Country' className='form-input'/>
                <button type='submit' className='form-button'>Sign Up</button>
            </form>
            <p>Already have an account? <span onClick={()=>props.setUserState(userStates.LOGIN)}>Sign in here</span></p>
        </div>
    );
};

export default Register;
