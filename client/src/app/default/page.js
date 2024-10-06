"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';

export default function DefaultPage() {
    const router = useRouter();
    const [token, setToken] = useState(null);
    const [currentPig, setCurrentPig] = useState('/pig.png');

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

        // Set up the image cycling
        const intervalId = setInterval(() => {
            setCurrentPig(prev => prev === '/pig.png' ? '/pig2.png' : '/pig.png');
        }, 500);

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [router, token, handleLogout]);

    const handleLogout = useCallback(() => {
        router.push('/logout');
    }, [router]); // Add router to the dependency array

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-[#E3A7A9]">
            <div className="flex flex-col items-center gap-8 w-full max-w-lg">
                <Image
                    src={currentPig}
                    alt="Pig"
                    width={150}
                    height={150}
                    className="rounded-full"
                />

                <div className="flex gap-8 flex-wrap justify-center">
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

                    <button
                        onClick={() => router.push('/user')}
                        className="px-6 py-3 bg-[#A1C7BE] text-white rounded-md hover:bg-[#A8AAC7] transition"
                    >
                        User Settings
                    </button>
                </div>

                <div className="w-full p-6 bg-white border border-gray-200 rounded-md shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-4 text-[#A8AAC7]">Why Saving is Awesome!</h2>
                    <p className="text-gray-700">
                        Saving money is like having a superpower! When you save:
                        <br /><br />
                        1. You can buy bigger, cooler things later &apos;🎮&apos;
                        <br />
                        2. You’re prepared for surprises (like when your bike needs fixing) &apos;🚲&apos;
                        <br />
                        3. You feel proud of yourself for being responsible &apos;💪&apos;
                        <br />
                        4. You can help others or donate to causes you care about &apos;🐶&apos;
                        <br />
                        5. You’re learning a skill that will make you super smart with money when you grow up &apos;🧠&apos;
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