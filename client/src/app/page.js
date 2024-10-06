"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import LoginModal from "./components/loginModal";
import { useRouter } from "next/navigation";

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
          router.push("/testocr");
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
    <main>
      {user ? (
        <>
          <p>Welcome, {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={() => setIsModalOpen(true)}>Login/Register</button>
      )}
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onLogin={handleLogin}
      />
    </main>
  );
}