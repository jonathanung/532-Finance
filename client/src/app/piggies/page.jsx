"use client"
import Link from 'next/link'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios';
import { useRouter } from "next/navigation";

export default function GameIntro() {
  const [scene, setScene] = useState(0);
  const [token, setToken] = useState(null);
  const router = useRouter();

    useEffect(() => {
      const validateToken = async () => {
      if (token) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/user`,
            { 
              headers: { 
                Authorization: `Bearer ${token}` 
              } 
            }
          );
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scene < 5) {
        setScene(scene + 1)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [scene])

  const sceneVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.5 } },
  }

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
          key={scene}
          variants={sceneVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          {scene === 0 && (
            <>
              <img
                src="/pig.png"
                alt="Piggles"
                className="w-64 h-64 mb-4"
              />
              <p className="text-2xl font-semibold">Saving money is good</p>
            </>
          )}
          {scene === 1 && (
            <>
              <div className="text-6xl mb-4">💵</div>
              <p className="text-2xl font-semibold">Saving money = saving pigs</p>
            </>
          )}
          {scene === 2 && (
            <>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/goldcoin-XgztbxO7qUHhdAVCCKkYxdCiQSTYVa.png"
                alt="Gold Coin"
                className="w-32 h-32 mb-4"
              />
              <p className="text-2xl font-semibold">Collect coins by saving</p>
            </>
          )}
          {scene === 3 && (
            <>
              <div className="flex justify-center items-center mb-4">
                <div className="text-5xl mr-4">💳</div>
                <div className="text-5xl">📷</div>
              </div>
              <p className="text-2xl font-semibold">Send a picture of your receipt!</p>
            </>
          )}
          {scene === 4 && (
            <>
              <Link href="/default">
                <div 
                  className="text-2xl py-8 px-12 rounded-full bg-[#A8AAC7] hover:bg-[#8A8BB5] text-black font-bold cursor-pointer transition-all transform hover:scale-105 shadow-lg">
                  Start Saving Now!
                </div>
              </Link>
              <p className="text-2xl font-semibold mt-4">Click here to begin and collect your coins!</p>
            </>
          )}

        </motion.div>
      </div>
    </div>
  )
}