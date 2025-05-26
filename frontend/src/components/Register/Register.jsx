import './Register.css';
import talkspace_logo from '../../assets/icons/talkspace_logo.svg';
import {userStates} from '../../const';
import axios from 'axios';
import config from '../../externals/config';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Using react-icons
import { useState } from 'react';



const Register = (props) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const handleRegister = async(e) => {
        e.preventDefault();
        if (password !== confirmPassword){
            toast.error("Password and Confirm Password do not match");
            return;
        }

        const data = {
            username: e.target[0].value,
            email: e.target[1].value,
            password: password,
            city: city,
            country: country,
        }

        try {
            const response = await axios.post(config.auth.register(), data);
            if (response.status === 200) {
                e.target.reset();
                toast.success("Registered successfully");
            }
            else{
                toast.error(response?.data.error || "Registration failed");
            }
        } catch (error) {
            toast.error(error.response?.data.error || "Registration failed");
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className='register'>
            <img src={talkspace_logo} alt="My LOGO" width={150} height={150}/>
            <h2>Create a new account</h2>
            <form className='register-form' onSubmit={handleRegister}>
                <input type='username' placeholder='Username' className='form-input' required/>
                <input type='email' placeholder='Email' className='form-input' required/>
                <div className='form-password'>
                    <input type={showPassword ? "text" : "password"} placeholder='Password' onChange={(e) => setPassword(e.target.value)} required/>
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {!showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                <div className='form-password'>
                    <input type={showConfirmPassword ? "text" : "password"} placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} required/>
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={toggleConfirmPasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {!showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                <input type='city' placeholder='City' className='form-input' onChange={(e) => setCity(e.target.value)}/>
                <input type='country' placeholder='Country' className='form-input' onChange={(e) => setCountry(e.target.value)}/>
                <button type='submit' className='form-button'>Sign Up</button>
            </form>
            <p>Already have an account? <span onClick={()=>props.setUserState(userStates.LOGIN)}>Sign in here</span></p>
        </div>
    );
};

export default Register;
