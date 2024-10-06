"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useRouter } from "next/navigation";
import axios from 'axios';
import Insights from '../components/insights';
import dynamic from 'next/dynamic';

const OCRModal = dynamic(() => import('../components/ocrModal'), {
  ssr: false,
});

const PIG_VARIANTS = [
  { filter: 'hue-rotate(0deg)', description: 'Original pink pig' },
  { filter: 'hue-rotate(45deg)', description: 'Orange pig' },
  { filter: 'hue-rotate(90deg)', description: 'Yellow pig' },
  { filter: 'hue-rotate(180deg)', description: 'Blue pig' },
  { filter: 'hue-rotate(270deg)', description: 'Purple pig' },
  { filter: 'hue-rotate(315deg)', description: 'Red pig' },
  { filter: 'hue-rotate(135deg)', description: 'Green pig' },
  { filter: 'hue-rotate(225deg)', description: 'Cyan pig' },
  { filter: 'hue-rotate(0deg) saturate(0)', description: 'Gray pig' },
  { filter: 'hue-rotate(0deg) invert(1)', description: 'Inverted pig' },
  { filter: 'hue-rotate(30deg)', description: 'Coral pig' },
  { filter: 'hue-rotate(60deg)', description: 'Lime pig' },
  { filter: 'hue-rotate(210deg)', description: 'Teal pig' },
  { filter: 'hue-rotate(300deg)', description: 'Magenta pig' },
  { filter: 'hue-rotate(330deg)', description: 'Rose pig' },
]

const SCENE_ITEMS = [
  [
    { level: 1, item: '🌱', description: 'A small sprout appears!' },
    { level: 2, item: '🪣', description: 'A water bucket for the pigs!' },
    { level: 3, item: '🌳', description: 'A shady tree grows!' },
    { level: 4, item: '🏠', description: 'A cozy pig house!' },
    { level: 5, item: '🛁', description: 'A mud bath for happy pigs!' },
  ],
  [
    { level: 1, item: '🚀', description: 'A small rocket appears!' },
    { level: 2, item: '🛰️', description: 'A satellite for space pigs!' },
    { level: 3, item: '🌠', description: 'A shimmering star!' },
    { level: 4, item: '👨‍🚀', description: 'An astronaut pig!' },
    { level: 5, item: '🌌', description: 'A cosmic nebula forms!' },
  ],
  [
    { level: 1, item: '🐠', description: 'A colorful fish swims by!' },
    { level: 2, item: '🌊', description: 'Waves for surfing pigs!' },
    { level: 3, item: '🐚', description: 'A beautiful seashell!' },
    { level: 4, item: '🧜‍♀️', description: 'A merpig appears!' },
    { level: 5, item: '🏝️', description: 'A tropical island forms!' },
  ],
]

const PIGS_PER_SCENE = 5
const TOTAL_SCENES = 6

export default function MovingPigsFarmGame() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [coins, setCoins] = useState(3)
  const [farmLevel, setFarmLevel] = useState(1)
  const [pigPositions, setPigPositions] = useState([])
  const [currentScene, setCurrentScene] = useState(0)
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);

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
      fetchUserData(storedToken);
    }
    else {
      router.push("/");
    }
  }, [router, token]);

  const fetchUserData = async (token) => {
    try {
      const [levelResponse, coinsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/level`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/coins`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      console.log('Level response:', levelResponse.data);
      console.log('Coins response:', coinsResponse.data);
      setFarmLevel(levelResponse.data);
      setCoins(coinsResponse.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const setFarmLevelDirectly = async (level) => {
    console.log('Setting farm level to:', level);
    if (level >= 1 && level <= PIG_VARIANTS.length) {
      try {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/level`,
          { level },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Server response for setting level:', response.data);
        setFarmLevel(level);
        const newScene = Math.min(Math.floor((level - 1) / PIGS_PER_SCENE), TOTAL_SCENES - 1);
        console.log('New scene calculated:', newScene);
        setCurrentScene(newScene);
      } catch (error) {
        console.error("Error updating farm level:", error);
      }
    } else {
      console.warn(`Invalid farm level: ${level}. Level must be between 1 and ${PIG_VARIANTS.length}.`);
    }
  };

  const setCoinsDirectly = async (amount) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/coins`,
        { coins: amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoins(amount);
    } catch (error) {
      console.error("Error updating coins:", error);
    }
  };

  useEffect(() => {
    console.log('Effect triggered. Farm level:', farmLevel, 'Current scene:', currentScene);
    movePigs();
  }, [movePigs]);

  const movePigs = () => {
    console.log('Current farm level:', farmLevel, typeof farmLevel);
    console.log('Current scene:', currentScene, typeof currentScene);
    console.log('PIGS_PER_SCENE:', PIGS_PER_SCENE, typeof PIGS_PER_SCENE);

    if (typeof farmLevel !== 'number' || isNaN(farmLevel)) {
      console.error('Invalid farmLevel:', farmLevel);
      return;
    }

    if (typeof currentScene !== 'number' || isNaN(currentScene)) {
      console.error('Invalid currentScene:', currentScene);
      return;
    }

    const pigsInSceneRaw = farmLevel - currentScene * PIGS_PER_SCENE;
    console.log('Raw pigs in scene:', pigsInSceneRaw);

    if (isNaN(pigsInSceneRaw)) {
      console.error('pigsInSceneRaw is NaN. farmLevel:', farmLevel, 'currentScene:', currentScene, 'PIGS_PER_SCENE:', PIGS_PER_SCENE);
      return;
    }

    const pigsInScene = Math.max(0, Math.min(pigsInSceneRaw, PIGS_PER_SCENE));
    console.log('Adjusted pigs in scene:', pigsInScene);

    if (pigsInScene < 0 || !Number.isInteger(pigsInScene) || isNaN(pigsInScene)) {
      console.error('Invalid pigsInScene value:', pigsInScene);
      return;
    }

    try {
      const newPositions = Array(pigsInScene).fill(0).map(() => ({
        left: Math.random() * 80 + 10,
        bottom: Math.random() * 30 + 10,
      }));
      setPigPositions(newPositions);
    } catch (error) {
      console.error('Error in movePigs:', error);
    }
  };

  const upgradeFarm = async () => {
    const isExpanding = farmLevel % PIGS_PER_SCENE === 0
    const cost = isExpanding ? 5 : 3
    
    console.log('Attempting to upgrade farm. Current level:', farmLevel, 'Current coins:', coins, 'Cost:', cost);

    if (coins >= cost && farmLevel < PIG_VARIANTS.length) {
      try {
        console.log('Sending use_coins request. Coins to use:', cost);
        const useCoinsResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/use_coins?coins=${cost}`,
          {},  // Empty body
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('use_coins response:', useCoinsResponse.data);
        
        // Update local coin state with the new value from the server
        setCoins(useCoinsResponse.data.remaining_coins);
        
        console.log('Sending level_up request');
        const levelUpResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/level_up`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('level_up response:', levelUpResponse.data);

        setFarmLevel(prev => prev + 1);
        
        if (isExpanding && currentScene < TOTAL_SCENES - 1) {
          setCurrentScene(prev => prev + 1);
        }
      } catch (error) {
        console.error("Error upgrading farm:", error);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
          console.error("Response headers:", error.response.headers);
        }
      }
    } else {
      console.log('Cannot upgrade farm. Not enough coins or max level reached.');
    }
  };

  const openOCR = () => {
    setIsOCRModalOpen(true);
  }

  const closeOCR = () => {
    setIsOCRModalOpen(false);
    fetchUserData(token);
  }

  const nextScene = () => {
    if (currentScene < TOTAL_SCENES - 1 && (currentScene + 1) * PIGS_PER_SCENE < farmLevel) {
      setCurrentScene(prev => prev + 1)
    }
  }

  const prevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1)
    }
  }

  const renderScene = () => {
    const startIndex = currentScene * PIGS_PER_SCENE
    const endIndex = Math.min(startIndex + PIGS_PER_SCENE, farmLevel)
    const pigsInScene = endIndex - startIndex

    const sceneBackgrounds = [
      'bg-gradient-to-b from-blue-200 to-blue-400',
      'bg-gradient-to-b from-purple-900 to-black',
      'bg-gradient-to-b from-blue-400 to-blue-900',
    ]

    const sceneGrounds = [
      'bg-[#A1C7BE]',
      'bg-gray-800',
      'bg-blue-600',
    ]

    return (
      <div className={`relative w-full h-64 ${sceneBackgrounds[currentScene]} rounded-lg overflow-hidden`}>
        <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-300 rounded-full"></div>
        <div className={`absolute bottom-0 left-0 right-0 h-1/2 ${sceneGrounds[currentScene]}`}></div>
        
        {SCENE_ITEMS[currentScene].slice(0, Math.min(pigsInScene, SCENE_ITEMS[currentScene].length)).map((item, index) => (
          <div key={index} className="absolute text-4xl" style={{bottom: '25%', left: `${20 + index * 20}%`}}>
            {item.item}
          </div>
        ))}
        
        {PIG_VARIANTS.slice(startIndex, endIndex).map((variant, index) => (
          <div key={index} className="absolute transition-all duration-500 ease-in-out" style={{bottom: `${pigPositions[index]?.bottom}%`, left: `${pigPositions[index]?.left}%`}}>
            <Image
              src="/pig.png"
              alt={variant.description}
              width={50}
              height={50}
              className="pixelated"
              style={{filter: variant.filter}}
            />
          </div>
        ))}

        {currentScene > 0 && (
          <button onClick={prevScene} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
        )}

        {farmLevel > (currentScene + 1) * PIGS_PER_SCENE && currentScene < TOTAL_SCENES - 1 && (
          <button onClick={nextScene} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 rounded-full p-1">
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        )}
      </div>
    )
  }

  const isExpanding = farmLevel % PIGS_PER_SCENE === 0 && currentScene < TOTAL_SCENES - 1
  const upgradeCost = isExpanding ? 5 : 3
  const upgradeButtonText = isExpanding ? 'Expand Farm' : 'Upgrade Farm'

  const sceneNames = ['Farm', 'Space', 'Underwater']

  return (
    <div className="min-h-screen bg-[#E3A7A9] flex justify-center items-center p-4">
      <div className="max-w-md mx-auto bg-[#A8AAC7] rounded-lg shadow-lg p-10 relative">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">Piggy Bank Adventures</h1>

        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold text-white">Coins: {coins}</div>
          <div className="text-xl font-semibold text-white">Total Pigs: {farmLevel}</div>
        </div>
        
        {renderScene()}
        
        <div className="mt-4 space-y-2">
          <button
            onClick={upgradeFarm}
            className="w-full bg-[#E3A7A9] hover:bg-[#d89598] text-white font-bold py-2 px-4 rounded transition duration-200"
            disabled={coins < upgradeCost || farmLevel >= PIG_VARIANTS.length}
          >
            {upgradeButtonText} ({upgradeCost} coins)
          </button>
          <button
            onClick={openOCR}
            className="w-full bg-[#A1C7BE] hover:bg-[#90b6ad] text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Upload your Receipt
          </button>
        </div>
        
        <p className="mt-4 text-sm text-center text-white">
          Upgrade your {sceneNames[currentScene].toLowerCase()} to attract more pigs and earn more coins!
        </p>
        
        {farmLevel < PIG_VARIANTS.length && (
          <p className="mt-2 text-sm text-center font-semibold text-white">
            Next upgrade: {isExpanding ? `New ${sceneNames[currentScene + 1]} expansion!` : PIG_VARIANTS[farmLevel].description}
          </p>
        )}

        <Insights token={token} />

        {isOCRModalOpen && (
          <OCRModal onClose={closeOCR} />
        )}
      </div>
    </div>
  )
}