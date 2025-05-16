"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGameStore } from "../store/gameStore"
import { socket } from "../socket"
import type { Player } from "../types"

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { playerName } = useGameStore()
  const [players, setPlayers] = useState<Player[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!playerName) {
      navigate("/")
      return
    }

    socket.emit(
      "lobby:getPlayers",
      { roomCode },
      (response: {
        players: Player[]
        isAdmin: boolean
        success: boolean
        error?: string
      }) => {
        if (response.success) {
          setPlayers(response.players)
          setIsAdmin(response.isAdmin)
        } else {
          alert(response.error || "Failed to get lobby information")
          navigate("/")
        }
      },
    )

    const handlePlayerJoined = (data: { players: Player[] }) => {
      setPlayers(data.players)
    }

    const handlePlayerKicked = (data: { players: Player[] }) => {
      setPlayers(data.players)
    }

    const handleGameStarted = () => {
      navigate(`/game/${roomCode}`)
    }

    socket.on("lobby:playerJoined", handlePlayerJoined)
    socket.on("lobby:playerKicked", handlePlayerKicked)
    socket.on("lobby:gameStarted", handleGameStarted)

    return () => {
      socket.off("lobby:playerJoined", handlePlayerJoined)
      socket.off("lobby:playerKicked", handlePlayerKicked)
      socket.off("lobby:gameStarted", handleGameStarted)
    }
  }, [roomCode, playerName, navigate])

  const handleStartGame = () => {
    socket.emit("lobby:start", { roomCode }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        alert(response.error || "Failed to start game")
      }
    })
  }

  const handleKickPlayer = (playerId: string) => {
    socket.emit("lobby:kick", { roomCode, playerId }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        alert(response.error || "Failed to kick player")
      }
    })
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-sky-500 mb-8">Lobby</h1>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Room: {roomCode}</h2>
          <button onClick={copyRoomCode} className="text-sky-500 hover:text-sky-600">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Players ({players.length}/6):</h3>
          <ul className="space-y-2">
            {players.map((player) => (
              <li key={player.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span>
                  {player.name} {player.isAdmin ? "(Admin)" : ""}
                </span>
                {isAdmin && !player.isAdmin && (
                  <button onClick={() => handleKickPlayer(player.id)} className="text-red-500 hover:text-red-600">
                    Kick
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isAdmin && (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 6}
            className={`w-full p-3 rounded-md text-white ${
              players.length === 6 ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start Game {players.length !== 6 && `(Need ${6 - players.length} more players)`}
          </button>
        )}

        {!isAdmin && <div className="text-center text-gray-500">Waiting for admin to start the game...</div>}
      </div>
    </div>
  )
}
