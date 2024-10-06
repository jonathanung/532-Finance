"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/${endpoint}`,
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
        localStorage.setItem('token', response.data.access_token);
        if (isLogin) {
          router.push('/default');
        } else {
          router.push('/piggies');
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-[#A1C7BE] text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A1C7BE]"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A1C7BE]"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A1C7BE]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A1C7BE]"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#A8AAC7] text-white rounded-md hover:bg-[#A1C7BE] transition"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-[#A1C7BE] hover:underline w-full text-center"
        >
          {isLogin ? 'Need to register?' : 'Already have an account?'}
        </button>
        <button
          onClick={onClose}
          className="mt-2 text-gray-500 hover:underline w-full text-center"
        >
          Close
        </button>
      </div>
    </div>
  );
}