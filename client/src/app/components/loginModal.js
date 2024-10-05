import { useState } from 'react';
import axios from 'axios';

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');


  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isLogin && (!email.trim() || !password.trim())) {
      setError('Email and password are required');
      return;
    }

    if (!isLogin && (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim())) {
      setError('All fields are required');
      return;
    }

    const endpoint = isLogin ? 'token' : 'register';
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/${endpoint}`, 
        isLogin 
          ? new URLSearchParams({ email, password }).toString()
          : { first_name: firstName, last_name: lastName, email, password },
        {
          headers: {
            'Content-Type': isLogin ? 'application/x-www-form-urlencoded' : 'application/json',
          },
        }
      );
      
      if (response.data.access_token) {
        setIsLogin(true);
        onLogin(response.data.access_token);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };
    
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need to register?' : 'Already have an account?'}
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}