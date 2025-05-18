"use client"

import { useState } from "react"
import type { GamePlayer } from "../types"

interface DeclareModalProps {
  onClose: () => void
  onDeclare: (setName: string, declarations: Record<string, string[]>) => void
  players: GamePlayer[]
  myTeamPlayers: GamePlayer[]
}

export default function DeclareModal({ onClose, onDeclare, players, myTeamPlayers }: DeclareModalProps) {
  const [selectedSet, setSelectedSet] = useState<string>("")
  const [declarations, setDeclarations] = useState<Record<string, string[]>>({})

  // All possible sets
  const sets = [
    "spades-low", // 2-7 of spades
    "spades-high", // 9-A of spades
    "hearts-low", // 2-7 of hearts
    "hearts-high", // 9-A of hearts
    "clubs-low", // 2-7 of clubs
    "clubs-high", // 9-A of clubs
    "diamonds-low", // 2-7 of diamonds
    "diamonds-high", // 9-A of diamonds
    "8s_and_jokers", // 8s of all suits and 2 jokers
  ]

  // Get cards for a set
  const getSetCards = (setName: string): { suit: string; values: string[] } => {
    if (setName === "8s_and_jokers") {
      return { suit: "mixed", values: ["8S", "8H", "8C", "8D", "RJ", "BJ"] } // Spade 8, Heart 8, Club 8, Diamond 8, Red Joker, Black Joker
    }

    const [suit, range] = setName.split("-")
    const values = range === "low" ? ["2", "3", "4", "5", "6", "7"] : ["9", "10", "J", "Q", "K", "A"]

    return { suit, values }
  }

  // Handle player selection for a card
  const handlePlayerSelection = (value: string, playerId: string) => {
    setDeclarations((prev) => {
      const newDeclarations = { ...prev }

      // Remove this value from any player who had it before
      Object.keys(newDeclarations).forEach((pid) => {
        newDeclarations[pid] = newDeclarations[pid].filter((v) => v !== value)
      })

      // Add to the selected player
      if (!newDeclarations[playerId]) {
        newDeclarations[playerId] = []
      }
      newDeclarations[playerId].push(value)

      return newDeclarations
    })
  }

  // Check if all cards in the set have been assigned
  const isSetComplete = () => {
    if (!selectedSet) return false

    const { values } = getSetCards(selectedSet)
    const allAssignedValues = Object.values(declarations).flat()

    // For 8s_and_jokers, we need exactly 6 assignments
    if (selectedSet === "8s_and_jokers") {
      // Ensure all 6 unique cards are assigned
      return values.every((value) => allAssignedValues.includes(value)) && allAssignedValues.length === values.length;
    }

    // For other sets, check if all values are assigned
    return values.every((value) => allAssignedValues.includes(value))
  }

  const handleDeclare = () => {
    if (selectedSet && isSetComplete()) {
      onDeclare(selectedSet, declarations)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Declare a Set</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Select Set to Declare:</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedSet}
            onChange={(e) => {
              setSelectedSet(e.target.value)
              setDeclarations({})
            }}
          >
            <option value="">Select a set</option>
            {sets.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>
        </div>

        {selectedSet && (
          <div>
            <h3 className="font-medium mb-2">Assign Cards to Players:</h3>
            <div className="space-y-4">
              {getSetCards(selectedSet).values.map((value, index) => (
                <div key={`${value}-${index}`} className="flex items-center gap-2">
                  <div className="w-24 font-medium"> {/* Adjusted width for longer card names like "Red Joker" */}
                    {selectedSet === "8s_and_jokers" ? value : value}
                  </div>
                  <select
                    className="flex-1 p-2 border rounded-md"
                    value={Object.entries(declarations).find(([_, values]) => values.includes(value))?.[0] || ""}
                    onChange={(e) => handlePlayerSelection(value, e.target.value)}
                  >
                    <option value="">Select player</option>
                    {myTeamPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button
            onClick={handleDeclare}
            disabled={!isSetComplete()}
            className={`px-4 py-2 rounded-md text-white ${
              isSetComplete() ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-400"
            }`}
          >
            Declare
          </button>
        </div>
      </div>
    </div>
  )
}
