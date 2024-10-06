"use client";

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const FARM_ITEMS = [
  { level: 1, item: '🌱', description: 'A small sprout appears!' },
  { level: 2, item: '🪣', description: 'A water bucket for the pigs!' },
  { level: 3, item: '🌳', description: 'A shady tree grows!' },
  { level: 4, item: '🏠', description: 'A cozy pig house!' },
  { level: 5, item: '🛁', description: 'A mud bath for happy pigs!' },
]

const PIG_VARIANTS = [
  { filter: 'hue-rotate(0deg)', description: 'Original pink pig' },
  { filter: 'hue-rotate(45deg)', description: 'Orange pig' },
  { filter: 'hue-rotate(90deg)', description: 'Yellow pig' },
  { filter: 'hue-rotate(180deg)', description: 'Blue pig' },
  { filter: 'hue-rotate(270deg)', description: 'Purple pig' },
]

const PIGS_PER_PAGE = 5

export default function MovingPigsFarmGame() {
  const [coins, setCoins] = useState(3)
  const [farmLevel, setFarmLevel] = useState(1)
  const [pigPositions, setPigPositions] = useState([])
  const [showUpgradeEffect, setShowUpgradeEffect] = useState(false)

  useEffect(() => {
    movePigs()
  }, [farmLevel])

  const movePigs = () => {
    const newPositions = PIG_VARIANTS.slice(0, farmLevel).map(() => ({
      left: Math.random() * 80 + 10,
      bottom: Math.random() * 30 + 10,
    }))
    setPigPositions(newPositions)
  }

  const upgradeFarm = () => {
    if (coins >= 3 && farmLevel < 5) {
      setCoins(coins - 3)
      setFarmLevel(prev => prev + 1)
      setTimeout(() => setShowUpgradeEffect(false), 1000)
    }
  }

  const earnCoins = () => {
    setCoins(prev => prev + 1)
  }

  const renderFarm = () => {
    return (
      <div className="relative w-full h-64 bg-[#A1C7BE] rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-blue-400">
        </div>

        <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-300 rounded-full"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#A1C7BE]"></div>
      
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-repeat-x" style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" fill=\"none\"><path d=\"M0 10h20M10 0v20\" stroke=\"%23805a3b\" stroke-width=\"2\"/></svg>')"}}></div>
        {FARM_ITEMS.slice(0, farmLevel).map((item, index) => (
          <div key={index} className="absolute text-4xl" style={{bottom: '25%', left: `${20 + index * 20}%`}}>
            {item.item}
          </div>
        ))}
        
        {PIG_VARIANTS.slice(0, farmLevel).map((variant, index) => (
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

        {showUpgradeEffect && (
          <div className="absolute inset-0 bg-yellow-300 opacity-50 animate-pulse"></div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#E3A7A9] flex justify-center items-center p-4">
      <div className="max-w-md mx-auto bg-[#A8AAC7] rounded-lg shadow-lg p-10 relative">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">Piggy Bank Farm</h1>

        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold text-white">Coins: {coins}</div>
          <div className="text-xl font-semibold text-white">Level: {farmLevel}</div>
        </div>
        
        {renderFarm()}
        
        <div className="mt-4 space-y-2">
          <button
            onClick={upgradeFarm}
            className="w-full bg-[#E3A7A9] hover:bg-[#d89598] text-white font-bold py-2 px-4 rounded transition duration-200"
            disabled={coins < 3 || farmLevel >= 5}
          >
            Upgrade Farm (3 coins)
          </button>
          <button
            onClick={earnCoins}
            className="w-full bg-[#A1C7BE] hover:bg-[#90b6ad] text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Upload your Receipt
          </button>
        </div>
        
        <p className="mt-4 text-sm text-center text-white">
          Upgrade your farm to attract more pigs and earn more coins!
        </p>
        
        {farmLevel < 5 && (
          <p className="mt-2 text-sm text-center font-semibold text-white">
            Next upgrade: {FARM_ITEMS[farmLevel].description}
          </p>
        )}

        <Link href="/game">
          <div className="relative bg-[#A1C7BE] m-3 p-2 mx-auto text-center rounded-md w-max text-white hover:bg-[#90b6ad] transition duration-200">
            Financial Insights
          </div>
        </Link>
      </div>
    </div>
  )
}