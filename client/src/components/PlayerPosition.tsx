"use client"

import type { GamePlayer } from "../types"

interface PlayerPositionProps {
  player: GamePlayer
  position: number
  totalPlayers: number
  onClick: () => void
  isActive: boolean
  arc?: number // in degrees
  myTeam?: "team1" | "team2"
  isMyTurn?: boolean
}

export default function PlayerPosition({ player, position, totalPlayers, onClick, isActive, arc = 210, myTeam, isMyTurn }: PlayerPositionProps) {
  // Fan arc above the bottom center: -75° to +75°
  const arcDegrees = 150
  const startAngle = -arcDegrees / 2 // -75
  const angleStep = arcDegrees / (totalPlayers - 1)
  const angle = (startAngle + position * angleStep) * (Math.PI / 180) // radians
  const radius = 85// % of container, increased for more spread

  // Origin is bottom center (x=50, y=100)
  const x = 50 + radius * Math.sin(angle)
  const y = 100 - radius * Math.cos(angle)

  const teamColor = player.team === "team1" ? "bg-blue-100 border-blue-400" : "bg-red-100 border-red-400"
  const activeRing = isActive ? "ring-4 ring-yellow-400" : ""
  const isTeammate = player.team === myTeam
  const nonClickableTeammate = isMyTurn && isTeammate

  const cursorStyle = nonClickableTeammate ? "cursor-not-allowed" : "cursor-pointer"
  const opacityStyle = nonClickableTeammate ? "opacity-50" : "hover:opacity-90"

  return (
    <div
      className={`absolute w-24 h-32 transform -translate-x-1/2 -translate-y-1/2 ${teamColor} ${activeRing} rounded-lg border-2 shadow-md flex flex-col items-center justify-center ${cursorStyle} ${opacityStyle} transition-opacity`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={nonClickableTeammate ? undefined : onClick}
    >
      <div className="relative w-16 h-20">
        {/* Stack of cards */}
        {Array.from({ length: Math.min(player.cards.length, 5) }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white border border-gray-300 rounded-md w-full h-full shadow-sm"
            style={{
              top: `${i * 2}px`,
              left: `${i * 1}px`,
              transform: `rotate(${i - 2}deg)`,
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">{player.cards.length}</div>
      </div>
      <div className="text-sm font-medium mt-1">{player.name}</div>
    </div>
  )
}
