"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useGameStore } from "../store/gameStore"
import { socket } from "../socket"
import type { Card, GamePlayer, GameState } from "../types"
import PlayerPosition from "../components/PlayerPosition"
import CardComponent from "../components/Card"
import AskModal from "../components/AskModal"
import DeclareModal from "../components/DeclareModal"
import CapturedSets from "../components/CapturedSets"

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { playerName, gameState, setGameState, resetGame } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [askModalOpen, setAskModalOpen] = useState(false)
  const [declareModalOpen, setDeclareModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<GamePlayer | null>(null)

  useEffect(() => {
    if (!playerName) {
      navigate("/")
      return
    }

    socket.emit(
      "game:getState",
      { roomCode },
      (response: {
        gameState: GameState
        success: boolean
        error?: string
      }) => {
        if (response.success) {
          setGameState(response.gameState)
        } else {
          alert(response.error || "Failed to get game state")
          navigate("/")
        }
      },
    )

    const handleGameStateUpdate = (data: { gameState: GameState }) => {
      setGameState(data.gameState)
    }

    const handleGameEnded = (data: {
      gameState: GameState
      winner: "team1" | "team2"
    }) => {
      setGameState(data.gameState)
      setTimeout(() => {
        alert(`${data.winner === "team1" ? "Team 1" : "Team 2"} wins!`)
      }, 500)
    }

    socket.on("game:stateUpdate", handleGameStateUpdate)
    socket.on("game:ended", handleGameEnded)

    return () => {
      socket.off("game:stateUpdate", handleGameStateUpdate)
      socket.off("game:ended", handleGameEnded)
    }
  }, [roomCode, playerName, navigate, setGameState])

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handlePlayerClick = (player: GamePlayer) => {
    if (gameState?.currentTurn?.playerId === socket.id && player.id !== socket.id) {
      setSelectedPlayer(player)
      setAskModalOpen(true)
    }
  }

  const handleAsk = (card: Card) => {
    if (!selectedPlayer) return

    socket.emit(
      "game:ask",
      {
        roomCode,
        targetPlayerId: selectedPlayer.id,
        card,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert(response.error || "Failed to ask for card")
        }
        setAskModalOpen(false)
        setSelectedPlayer(null)
      },
    )
  }

  const handleDeclare = (setName: string, declarations: Record<string, string[]>) => {
    socket.emit(
      "game:declare",
      {
        roomCode,
        setName,
        declarations,
      },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          alert(response.error || "Failed to declare set")
        }
        setDeclareModalOpen(false)
      },
    )
  }

  const handlePlayAgain = () => {
    socket.emit("lobby:reset", { roomCode }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        resetGame()
        navigate(`/lobby/${roomCode}`)
      } else {
        alert(response.error || "Failed to reset game")
      }
    })
  }

  if (!gameState) {
    return <div className="min-h-screen flex items-center justify-center">Loading game...</div>
  }

  const currentPlayer = gameState.players.find((p) => p.id === socket.id)
  const isMyTurn = gameState.currentTurn?.playerId === socket.id
  const gameEnded =
    gameState.team1Sets.length + gameState.team2Sets.length >= 9 || gameState.players.every((p) => p.cards.length === 0)
  const myTeam = currentPlayer?.team
  const didIWin =
    (myTeam === "team1" && gameState.team1Sets.length > gameState.team2Sets.length) ||
    (myTeam === "team2" && gameState.team2Sets.length > gameState.team1Sets.length)

  // Sort other players so teammates are 2nd and 4th in the arc
  const otherPlayers = gameState.players.filter((p) => p.id !== socket.id)
  const teammates = otherPlayers.filter((p) => p.team === myTeam)
  const opponents = otherPlayers.filter((p) => p.team !== myTeam)
  let alternatingPlayers = []
  if (otherPlayers.length === 5) {
    // Opponent, Teammate, Opponent, Teammate, Opponent
    alternatingPlayers = [
      opponents[0],
      teammates[0],
      opponents[1],
      teammates[1],
      opponents[2],
    ]
  } else {
    // fallback to previous alternating logic
    const team1 = otherPlayers.filter((p) => p.team === "team1")
    const team2 = otherPlayers.filter((p) => p.team === "team2")
    let t1 = 0, t2 = 0
    for (let i = 0; i < otherPlayers.length; i++) {
      if (i % 2 === 0 && t1 < team1.length) {
        alternatingPlayers.push(team1[t1++])
      } else if (t2 < team2.length) {
        alternatingPlayers.push(team2[t2++])
      } else if (t1 < team1.length) {
        alternatingPlayers.push(team1[t1++])
      }
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-4 relative">
      {/* Turn indicator */}
      <div
        className={`fixed top-0 left-0 right-0 py-2 text-center text-white font-bold ${isMyTurn ? "bg-emerald-500" : "bg-gray-500"}`}
      >
        {isMyTurn ? "Your Turn" : `${gameState.currentTurn?.playerName}'s Turn`}
      </div>

      {/* Game board */}
      <div className="relative w-full max-w-4xl aspect-square">
        {/* Other players */}
        {alternatingPlayers.map((player, index) => (
          <PlayerPosition
            key={player.id}
            player={player}
            position={index}
            totalPlayers={5}
            arc={210}
            onClick={() => handlePlayerClick(player)}
            isActive={gameState.currentTurn?.playerId === player.id}
          />
        ))}

        {/* Center - Captured sets */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8">
          <CapturedSets sets={gameState.team1Sets} teamName="Team 1" isMyTeam={myTeam === "team1"} />
          <CapturedSets sets={gameState.team2Sets} teamName="Team 2" isMyTeam={myTeam === "team2"} />
        </div>

        {/* Current player's hand */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-2 p-4 bg-white/80 rounded-t-lg shadow-lg">
          {currentPlayer?.cards
            .sort((a, b) => {
              // Sort by set, then by value
              if (a.set !== b.set) return a.set.localeCompare(b.set)
              return a.value.localeCompare(b.value)
            })
            .map((card) => (
              <CardComponent
                key={`${card.set}-${card.value}`}
                card={card}
                onClick={() => handleCardClick(card)}
                selected={selectedCard?.value === card.value && selectedCard?.set === card.set}
                disabled={!isMyTurn}
              />
            ))}
        </div>
        {/* Show own name below cards */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2 text-lg font-semibold text-gray-700">
          {currentPlayer?.name}
        </div>
      </div>

      {/* Declare button */}
      <button
        onClick={() => setDeclareModalOpen(true)}
        disabled={!isMyTurn}
        className={`fixed bottom-4 right-4 p-3 rounded-full ${
          isMyTurn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400"
        } text-white shadow-lg`}
      >
        Declare
      </button>

      {/* Modals */}
      {askModalOpen && selectedPlayer && (
        <AskModal
          player={selectedPlayer}
          onClose={() => setAskModalOpen(false)}
          onAsk={handleAsk}
          myCards={currentPlayer?.cards || []}
        />
      )}

      {declareModalOpen && (
        <DeclareModal
          onClose={() => setDeclareModalOpen(false)}
          onDeclare={handleDeclare}
          players={gameState.players}
          myTeamPlayers={gameState.players.filter((p) => p.team === myTeam)}
        />
      )}

      {/* Game over overlay */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4">{didIWin ? "You Win!" : "You Lose!"}</h2>
            <p className="mb-6">
              Team 1: {gameState.team1Sets.length} sets | Team 2: {gameState.team2Sets.length} sets
            </p>
            <button
              onClick={handlePlayAgain}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
