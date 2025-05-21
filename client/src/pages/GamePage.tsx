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
import DeclarationResultModal from "../components/DeclarationResultModal"

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { playerName, gameState, setGameState, resetGame } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [askModalOpen, setAskModalOpen] = useState(false)
  const [declareModalOpen, setDeclareModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<GamePlayer | null>(null)
  const [cardOrder, setCardOrder] = useState<Card[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dismissedDeclarationIds, setDismissedDeclarationIds] = useState<string[]>([])

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
        alert(`${data.winner === "team1" ? "Blue Team" : "Red Team"} wins!`)
      }, 500)
    }

    socket.on("game:stateUpdate", handleGameStateUpdate)
    socket.on("game:ended", handleGameEnded)

    return () => {
      socket.off("game:stateUpdate", handleGameStateUpdate)
      socket.off("game:ended", handleGameEnded)
    }
  }, [roomCode, playerName, navigate, setGameState])

  useEffect(() => {
    if (!gameState) return
    const player = gameState.players.find((p) => p.id === socket.id)
    if (!player) return
    const sorted = [...player.cards].sort((a, b) => {
      if (a.set !== b.set) return a.set.localeCompare(b.set)
      return a.value.localeCompare(b.value)
    })
    setCardOrder(sorted)
  }, [gameState])

  const handleCardClick = (card: Card) => {
    setSelectedCard(card)
  }

  const handlePlayerClick = (player: GamePlayer) => {
    if (gameState?.currentTurn?.playerId === socket.id && player.id !== socket.id && player.team !== myTeam) {
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

  const BLUE_TEAM_NAME = "Blue Team";
  const RED_TEAM_NAME = "Red Team";

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

  // Handlers for native HTML5 drag-and-drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOverCard = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDropCard = (index: number) => {
    if (draggedIndex === null) return
    const items = Array.from(cardOrder)
    const [moved] = items.splice(draggedIndex, 1)
    items.splice(index, 0, moved)
    setCardOrder(items)
    setDraggedIndex(null)
  }

  const formatCardName = (card: Card): string => {
    const valueMap: Record<string, string> = {
      "A": "Ace", "K": "King", "Q": "Queen", "J": "Jack", "10": "10",
      "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
      "RJ": "Red Joker", "BJ": "Black Joker"
    };
    const setMap: Record<string, string> = {
      "spades": "Spades", "hearts": "Hearts", "clubs": "Clubs", "diamonds": "Diamonds"
    };
    
    // Ensure card value gets translated if a mapping exists (e.g., "BJ" to "Black Joker")
    const cardValue = valueMap[card.value] || card.value;

    // Handle Jokers specifically: they should just return their name (e.g., "Red Joker")
    // Check card.set by converting to lowercase to handle "jokers" or "Jokers"
    if (card && card.set && card.set.toLowerCase() === "jokers") {
      return cardValue; // This should be "Red Joker" or "Black Joker"
    }

    // For all other cards, format as "Value of Set"
    const cardSetDisplay = setMap[card.set] || card.set;
    return `${cardValue} of ${cardSetDisplay}`;
  };

  const handleCloseDeclarationResult = () => {
    if (gameState && gameState.lastDeclaration) {
      // Add the ID to the dismissed list
      if (gameState.lastDeclaration.id) {
        setDismissedDeclarationIds(prev => [...prev, gameState.lastDeclaration!.id]);
      }

      // Also, clear it from the current game state for immediate UI update,
      // though the main check will be against dismissedDeclarationIds
      const newState = {
        ...gameState,
        lastDeclaration: null, 
      };
      setGameState(newState);
    }
  };

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
            myTeam={myTeam}
            isMyTurn={isMyTurn}
          />
        ))}

        {/* Center - Captured sets */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-8">
          {myTeam === "team1" ? (
            <>
              <CapturedSets
                sets={gameState.team1Sets}
                teamName={BLUE_TEAM_NAME}
                teamId="team1"
              />
              <CapturedSets
                sets={gameState.team2Sets}
                teamName={RED_TEAM_NAME}
                teamId="team2"
              />
            </>
          ) : (
            <>
              <CapturedSets
                sets={gameState.team2Sets}
                teamName={RED_TEAM_NAME}
                teamId="team2"
              />
              <CapturedSets
                sets={gameState.team1Sets}
                teamName={BLUE_TEAM_NAME}
                teamId="team1"
              />
            </>
          )}
        </div>

        {/* Container for Current player's hand and name */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center w-full px-4">
          {/* Current player's hand */}
          <div className="flex gap-2 p-4 bg-white/80 rounded-t-lg shadow-lg overflow-x-auto">
            {cardOrder.map((card, index) => (
              <div
                key={`${card.set}-${card.value}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOverCard}
                onDrop={() => handleDropCard(index)}
                className="cursor-grab"
              >
                <CardComponent
                  card={card}
                  onClick={() => handleCardClick(card)}
                  selected={selectedCard?.value === card.value && selectedCard?.set === card.set}
                  disabled={!isMyTurn}
                />
              </div>
            ))}
          </div>
          {/* Show own name below cards */}
          <div
            className={`py-2 text-lg font-semibold w-full text-center rounded-b-lg shadow-lg border-2 ${
              myTeam === "team1"
                ? "bg-blue-100 border-blue-400 text-black"
                : "bg-red-100 border-red-400 text-black"
            }`}
          >
            {currentPlayer?.name}
          </div>
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
          declaredSets={[...gameState.team1Sets.map(s => s.name), ...gameState.team2Sets.map(s => s.name)]}
        />
      )}

      {/* Game over overlay */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-4xl font-bold mb-4">{didIWin ? "You Win!" : "You Lose!"}</h2>
            <p className="mb-6">
              {BLUE_TEAM_NAME}: {gameState.team1Sets.length} sets | {RED_TEAM_NAME}: {gameState.team2Sets.length} sets
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

      {/* Last asked question display */}
      {gameState.lastAsk && (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm shadow-lg">
          Last Question: {gameState.lastAsk.askingPlayerName} asked {gameState.lastAsk.targetPlayerName} for the {formatCardName(gameState.lastAsk.card)}
        </div>
      )}

      {/* Declaration Result Modal */}
      {gameState.lastDeclaration && !dismissedDeclarationIds.includes(gameState.lastDeclaration.id) && (
        <DeclarationResultModal
          details={gameState.lastDeclaration}
          onClose={handleCloseDeclarationResult}
          formatCardName={formatCardName} 
        />
      )}
    </div>
  )
}
