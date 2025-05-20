"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useGameStore } from "../store/gameStore"
import { socket } from "../socket"

export default function LandingPage() {
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [activeTab, setActiveTab] = useState<"join" | "create">("join")
  const navigate = useNavigate()
  const { setPlayerName, kickedFromLobbyMessage, setKickedFromLobbyMessage } = useGameStore()

  useEffect(() => {
    if (kickedFromLobbyMessage) {
      alert(kickedFromLobbyMessage)
      setKickedFromLobbyMessage(null)
    }
  }, [kickedFromLobbyMessage, setKickedFromLobbyMessage])

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

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-sky-500 mb-16">literature</h1>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 text-xl font-medium ${
              activeTab === "join" ? "text-sky-600 border-b-2 border-sky-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("join")}
          >
            join game
          </button>
          <button
            className={`flex-1 py-2 text-xl font-medium ${
              activeTab === "create" ? "text-sky-600 border-b-2 border-sky-400" : "text-gray-400"
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
              className="w-full p-4 bg-gray-100 rounded-md text-gray-700"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="room code"
              className="w-full p-4 bg-gray-100 rounded-md text-gray-700"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full p-4 bg-sky-400 hover:bg-sky-500 text-white rounded-md text-xl transition-colors"
            >
              join game
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateGame} className="space-y-4">
            <input
              type="text"
              placeholder="your name"
              className="w-full p-4 bg-gray-100 rounded-md text-gray-700"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="new room code"
              className="w-full p-4 bg-gray-100 rounded-md text-gray-700"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full p-4 bg-sky-400 hover:bg-sky-500 text-white rounded-md text-xl transition-colors"
            >
              create game
            </button>
          </form>
        )}
      </div>

      <button className="mt-8 text-sky-500 hover:underline text-lg">learn how to play</button>
    </div>
  )
}
