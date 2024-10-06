"use client";

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function DefaultPage() {
    const router = useRouter();
    const [token, setToken] = useState(null);
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
        //   setUser(response.data);
        //   router.push("/testocr");
        } catch (error) {
          console.error("Token validation failed:", error);
          if (error.response && error.response.status === 401) {
              handleLogout();
              router.push("/");
          }
        }
      }
    };
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      validateToken();
    }
    else {
      router.push("/");
    }
  }, []);

  const handleLogout = () => {
    router.push('/logout');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#E3A7A9]">
      <div className="flex flex-col items-center gap-8 w-full max-w-lg">
        <Image
          src="/pig.png"
          alt="Pig"
          width={150}
          height={150}
          className="rounded-full"
        />

        <div className="flex gap-8">
          <button
            onClick={() => router.push('/game')}
            className="px-6 py-3 bg-[#A1C7BE] text-white rounded-md hover:bg-[#A8AAC7] transition"
          >
            Pig Game
          </button>

          <button
            onClick={() => router.push('/finance')}
            className="px-6 py-3 bg-[#A8AAC7] text-white rounded-md hover:bg-[#A1C7BE] transition"
          >
            Finances
          </button>
        </div>

        <div className="w-full p-6 bg-white border border-gray-200 rounded-md shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#A8AAC7]">General Rules</h2>
          <p className="text-gray-700">
            ...game rules...
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-[#E3A7A9] text-white rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </main>
  );
}