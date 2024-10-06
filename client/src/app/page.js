"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import AuthModal from "./components/authModal";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPig, setCurrentPig] = useState("/pig.png");

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPig(prev => prev === "/pig.png" ? "/pig2.png" : "/pig.png");
    }, 500); // Switch every 500ms

    return () => clearInterval(interval);
  }, []);

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
      <h1 className="text-4xl md:text-6xl font-bold mb-12 text-primary">
        Welcome to Pignance!
      </h1>

      <div className="relative w-96 h-96 mb-8">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {user ? (
            <>
              <img
                src={currentPig}
                alt="Piggles"
                className="w-64 h-64 mb-4"
              />
              <p className="text-2xl font-semibold mb-4">Welcome, {user.email}</p>
              <button 
                onClick={handleLogout}
                className="text-xl py-4 px-8 rounded-full bg-[#A8AAC7] hover:bg-[#8A8BB5] text-black font-bold cursor-pointer transition-all duration-300 ease-in-out shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <img
                src={currentPig}
                alt="Piggles"
                className="w-64 h-64 mb-4"
              />
              <p className="text-2xl font-semibold mb-4">Start your savings journey!</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xl py-4 px-8 rounded-full bg-[#A8AAC7] hover:bg-[#8A8BB5] text-black font-bold cursor-pointer transition-all duration-300 ease-in-out shadow-lg"
              >
                Login/Register
              </button>
            </>
          )}
        </div>
      </div>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLogin={handleLogin}
      />
    </div>
  );
}