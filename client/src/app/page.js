"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import AuthModal from "./components/authModal";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}:${process.env.NEXT_PUBLIC_PORT}/user`,
            { 
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
          setUser(response.data);
          router.push("/default");
        } catch (error) {
          console.error("Token validation failed:", error);
          if (error.response && error.response.status === 401) {
            handleLogout();
          }
        }
      }
    };

    validateToken();
  }, [token]);

  const handleLogin = (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#E3A7A9] to-purple-100 p-8">
      <motion.h1
        className="text-4xl md:text-6xl font-bold mb-12 text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Welcome to Pignance!
      </motion.h1>

      <div className="relative w-96 h-96 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          {user ? (
            <>
              <img
                src="/pig.png"
                alt="Piggles"
                className="w-64 h-64 mb-4"
              />
              <p className="text-2xl font-semibold mb-4">Welcome, {user.email}</p>
              <button 
                onClick={handleLogout}
                className="text-xl py-4 px-8 rounded-full bg-[#A8AAC7] hover:bg-[#8A8BB5] text-black font-bold cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <img
                src="/pig.png"
                alt="Piggles"
                className="w-64 h-64 mb-4"
              />
              <p className="text-2xl font-semibold mb-4">Start your savings journey!</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xl py-4 px-8 rounded-full bg-[#A8AAC7] hover:bg-[#8A8BB5] text-black font-bold cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
              >
                Login/Register
              </button>
            </>
          )}
        </motion.div>
      </div>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLogin={handleLogin}
      />
    </div>
  );
}