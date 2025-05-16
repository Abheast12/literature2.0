"use client"

import { useState } from "react"
import type { Card, GamePlayer } from "../types"

interface AskModalProps {
  player: GamePlayer
  onClose: () => void
  onAsk: (card: Card) => void
  myCards: Card[]
}

export default function AskModal({ player, onClose, onAsk, myCards }: AskModalProps) {
  const [selectedSet, setSelectedSet] = useState<string>("")
  const [selectedValue, setSelectedValue] = useState<string>("")

  // Get unique sets from my cards
  const sets = Array.from(new Set(myCards.map((card) => card.set)))

  // Get unique values from the selected set that I have
  const values = selectedSet
    ? Array.from(new Set(myCards.filter((card) => card.set === selectedSet).map((card) => card.value)))
    : []

  // Get values I don't have in the selected set
  const missingValues = selectedSet ? getSetValues(selectedSet).filter((value) => !values.includes(value)) : []

  function getSetValues(set: string): string[] {
    if (set === "jokers") return ["joker"]

    // For regular sets (suits)
    return ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  }

  const handleAsk = () => {
    if (selectedSet && selectedValue) {
      onAsk({ set: selectedSet, value: selectedValue })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Ask {player.name} for a card</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Set:</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedSet}
            onChange={(e) => {
              setSelectedSet(e.target.value)
              setSelectedValue("")
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
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Value:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="">Select a value</option>
              {missingValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button
            onClick={handleAsk}
            disabled={!selectedSet || !selectedValue}
            className={`px-4 py-2 rounded-md text-white ${
              selectedSet && selectedValue ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
            }`}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
