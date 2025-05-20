"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGameStore } from "../store/gameStore"
import { socket } from "../socket"
import type { Player } from "../types"

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { playerName, setKickedFromLobbyMessage } = useGameStore()
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

    const handlePlayerKickedEvent = (data: { players: Player[] }) => {
      setPlayers(data.players)
    }

    const handleKicked = () => {
      setKickedFromLobbyMessage("You were kicked from the lobby.")
      navigate("/")
    }

    const handleTeamUpdate = (data: { players: Player[] }) => {
      setPlayers(data.players)
    }

    const handleGameStarted = () => {
      navigate(`/game/${roomCode}`)
    }

    socket.on("lobby:playerJoined", handlePlayerJoined)
    socket.on("lobby:playerKicked", handlePlayerKickedEvent)
    socket.on("lobby:kicked", handleKicked)
    socket.on("lobby:teamUpdate", handleTeamUpdate)
    socket.on("lobby:gameStarted", handleGameStarted)

    return () => {
      socket.off("lobby:playerJoined", handlePlayerJoined)
      socket.off("lobby:playerKicked", handlePlayerKickedEvent)
      socket.off("lobby:kicked", handleKicked)
      socket.off("lobby:teamUpdate", handleTeamUpdate)
      socket.off("lobby:gameStarted", handleGameStarted)
    }
  }, [roomCode, playerName, navigate, setKickedFromLobbyMessage])

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

  const handleAssignTeam = (playerId: string, team: "team1" | "team2") => {
    socket.emit("lobby:assignTeam", { roomCode, playerId, team }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        alert(response.error || "Failed to assign team")
      }
    })
  }

  const onDragStart = (e: React.DragEvent<HTMLLIElement>, playerId: string) => {
    if (!isAdmin) return;
    e.dataTransfer.setData("playerId", playerId);
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isAdmin) return;
    e.preventDefault();
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetTeam: "team1" | "team2") => {
    if (!isAdmin) return;
    e.preventDefault();
    const playerId = e.dataTransfer.getData("playerId");
    const playerToMove = players.find(p => p.id === playerId);
    if (playerToMove && playerToMove.team !== targetTeam) {
      handleAssignTeam(playerId, targetTeam);
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || "")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const team1Players = players.filter(p => p.team === "team1");
  const team2Players = players.filter(p => p.team === "team2");
  const unassignedPlayers = players.filter(p => p.team === null || p.team === undefined);

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-sky-500 mb-8">Lobby</h1>

      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Room: {roomCode}</h2>
          <button onClick={copyRoomCode} className="text-sky-500 hover:text-sky-600">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-center">Players ({players.length}/6)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg ${isAdmin ? 'min-h-[200px]' : ''}`}
              onDragOver={isAdmin ? onDragOver : undefined}
              onDrop={isAdmin ? (e) => onDrop(e, "team1") : undefined}
            >
              <h4 className="text-xl font-semibold mb-3 text-center text-blue-600">Blue Team</h4>
              <ul className="space-y-2">
                {team1Players.map((player) => (
                  <li
                    key={player.id}
                    draggable={isAdmin}
                    onDragStart={isAdmin ? (e) => onDragStart(e, player.id) : undefined}
                    className={`flex justify-between items-center p-3 bg-blue-50 rounded-md ${isAdmin ? 'cursor-grab' : ''}`}
                  >
                    <span>
                      {player.name} {player.isAdmin ? "(Admin)" : ""}
                    </span>
                    {isAdmin && !player.isAdmin && (
                      <button onClick={() => handleKickPlayer(player.id)} className="text-red-500 hover:text-red-600 text-xs">
                        Kick
                      </button>
                    )}
                  </li>
                ))}
                {team1Players.length === 0 && <p className="text-gray-400 text-center">Drag players here</p>}
              </ul>
            </div>

            <div
              className={`p-4 border rounded-lg ${isAdmin ? 'min-h-[200px]' : ''}`}
              onDragOver={isAdmin ? onDragOver : undefined}
              onDrop={isAdmin ? (e) => onDrop(e, "team2") : undefined}
            >
              <h4 className="text-xl font-semibold mb-3 text-center text-red-600">Red Team</h4>
              <ul className="space-y-2">
                {team2Players.map((player) => (
                  <li
                    key={player.id}
                    draggable={isAdmin}
                    onDragStart={isAdmin ? (e) => onDragStart(e, player.id) : undefined}
                    className={`flex justify-between items-center p-3 bg-red-50 rounded-md ${isAdmin ? 'cursor-grab' : ''}`}
                  >
                    <span>
                      {player.name} {player.isAdmin ? "(Admin)" : ""}
                    </span>
                    {isAdmin && !player.isAdmin && (
                      <button onClick={() => handleKickPlayer(player.id)} className="text-red-500 hover:text-red-600 text-xs">
                        Kick
                      </button>
                    )}
                  </li>
                ))}
                {team2Players.length === 0 && <p className="text-gray-400 text-center">Drag players here</p>}
              </ul>
            </div>
          </div>
          
          {unassignedPlayers.length > 0 && (
            <div className="mt-4 p-4 border border-dashed rounded-lg">
              <h4 className="text-lg font-semibold mb-2 text-center text-gray-500">Unassigned Players</h4>
              <ul className="space-y-2">
                {unassignedPlayers.map((player) => (
                  <li
                    key={player.id}
                    draggable={isAdmin}
                    onDragStart={isAdmin ? (e) => onDragStart(e, player.id) : undefined}
                    className={`flex justify-between items-center p-3 bg-gray-100 rounded-md ${isAdmin ? 'cursor-grab' : ''}`}
                  >
                    <span>
                      {player.name} {player.isAdmin ? "(Admin)" : ""}
                    </span>
                    {isAdmin && !player.isAdmin && (
                      <button onClick={() => handleKickPlayer(player.id)} className="text-red-500 hover:text-red-600 text-xs">
                        Kick
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
