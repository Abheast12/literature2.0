"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGameStore } from "../store/gameStore"
import { socket } from "../socket"
import HowToPlayModal from "../features/rules/HowToPlayModal"

export default function LandingPage() {
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [activeTab, setActiveTab] = useState<"join" | "create">("join")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()
  const { setPlayerName } = useGameStore()

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setPlayerName(username)
    socket.emit("lobby:join", { username, roomCode }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        navigate(`/lobby/${roomCode}`)
      } else {
        alert(response.error || "Failed to join game")
      }
    })
  }

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !roomCode.trim()) return

    setPlayerName(username)
    socket.emit("lobby:create", { username, roomCode }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        navigate(`/lobby/${roomCode}`)
      } else {
        alert(response.error || "Failed to create game")
      }
    })
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-200">
      <div className="text-center mb-6">
        <h1 className="text-6xl font-serif text-[#6b2b25] mb-2">LITERATURE</h1>
        <h2 className="text-xl font-serif text-[#6b2b25]">The Memory-Based Card Game</h2>
      </div>

      {/* Card fan display */}
      <div className="relative w-72 h-48 mb-8">
        {/* Ace of Spades - Bottom card */}
        <div className="absolute left-[calc(50%-64px)] bottom-2 origin-bottom-left transform rotate-[-25deg] w-28 h-40 bg-[#f5f0e1] rounded-md border border-gray-300 shadow-md z-10">
          <div className="absolute top-1 left-1 flex flex-col items-center">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight">A</div>
            <div className="text-sm mt-[-4px]">♠</div>
          </div>
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight">A</div>
            <div className="text-sm mt-[-4px]">♠</div>
          </div>
        </div>

        {/* Ace of Diamonds - Second card */}
        <div className="absolute left-[calc(50%-48px)] bottom-3 origin-bottom-left transform rotate-[-10deg] w-28 h-40 bg-[#f5f0e1] rounded-md border border-gray-300 shadow-md z-20">
          <div className="absolute top-1 left-1 flex flex-col items-center">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight text-red-500">A</div>
            <div className="text-sm mt-[-4px] text-red-500">♦</div>
          </div>
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight text-red-500">A</div>
            <div className="text-sm mt-[-4px] text-red-500">♦</div>
          </div>
        </div>

        {/* Ace of Hearts - Third card */}
        <div className="absolute left-[calc(50%-32px)] bottom-4 origin-bottom-left transform rotate-[5deg] w-28 h-40 bg-[#f5f0e1] rounded-md border border-gray-300 shadow-md z-30">
          <div className="absolute top-1 left-1 flex flex-col items-center">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight text-red-500">A</div>
            <div className="text-sm mt-[-4px] text-red-500">♥</div>
          </div>
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight text-red-500">A</div>
            <div className="text-sm mt-[-4px] text-red-500">♥</div>
          </div>
        </div>

        {/* Ace of Clubs - Front card (fully visible) */}
        <div className="absolute left-[calc(50%-16px)] bottom-5 origin-bottom-left transform rotate-[20deg] w-28 h-40 bg-[#f5f0e1] rounded-md border border-gray-300 shadow-md flex flex-col items-center justify-center p-2 z-40">
          <div className="absolute top-1 left-1 flex flex-col items-center">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight">A</div>
            <div className="text-sm mt-[-4px]">♣</div>
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className="text-6xl">♣</div>
          </div>
          <div className="absolute bottom-1 right-1 flex flex-col items-center rotate-180">
            <div className="text-xl font-bold font-card tracking-tighter leading-tight">A</div>
            <div className="text-sm mt-[-4px]">♣</div>
          </div>
        </div>
      </div>

      <div className="bg-[#f5f0e1] rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex mb-6 border-b border-[#6b2b25]/20">
          <button
            className={`flex-1 py-2 text-xl font-serif ${
              activeTab === "join" ? "text-green-700 border-b-2 border-green-700" : "text-[#6b2b25]/60"
            }`}
            onClick={() => setActiveTab("join")}
          >
            join game
          </button>
          <button
            className={`flex-1 py-2 text-xl font-serif ${
              activeTab === "create" ? "text-[#6b2b25] border-b-2 border-[#6b2b25]" : "text-[#6b2b25]/60"
            }`}
            onClick={() => setActiveTab("create")}
          >
            create game
          </button>
        </div>

        {activeTab === "join" ? (
          <form onSubmit={handleJoinGame} className="space-y-4">
            <input
              type="text"
              placeholder="your name"
              className="w-full p-4 bg-[#e5d9c0] rounded-md text-[#6b2b25] border-0 placeholder-[#6b2b25]/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="room code"
              className="w-full p-4 bg-[#e5d9c0] rounded-md text-[#6b2b25] border-0 placeholder-[#6b2b25]/50"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-md text-xl transition-colors font-serif"
            >
              join game
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateGame} className="space-y-4">
            <input
              type="text"
              placeholder="your name"
              className="w-full p-4 bg-[#e5d9c0] rounded-md text-[#6b2b25] border-0 placeholder-[#6b2b25]/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="new room code"
              className="w-full p-4 bg-[#e5d9c0] rounded-md text-[#6b2b25] border-0 placeholder-[#6b2b25]/50"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full p-4 bg-[#6b2b25] hover:bg-[#5a241f] text-white rounded-md text-xl transition-colors font-serif"
            >
              create game
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <button
            onClick={openModal}
            className="text-[#6b2b25] hover:underline text-lg font-serif"
          >
            learn how to play
          </button>
        </div>
      </div>
      <HowToPlayModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  )
}
