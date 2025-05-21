"use client"

import { useState } from "react"
import type { Card, GamePlayer } from "../types"

interface AskModalProps {
  player: GamePlayer
  onClose: () => void
  onAsk: (card: Card) => void
  myCards: Card[]
}

// Define the structure of askable sets and their constituent cards
const ALL_ASKABLE_SETS_CONFIG: Record<string, { set: string; values: string[] }[]> = {
  "Spades Low": [{ set: "spades", values: ["2", "3", "4", "5", "6", "7"] }],
  "Spades High": [{ set: "spades", values: ["9", "10", "J", "Q", "K", "A"] }],
  "Hearts Low": [{ set: "hearts", values: ["2", "3", "4", "5", "6", "7"] }],
  "Hearts High": [{ set: "hearts", values: ["9", "10", "J", "Q", "K", "A"] }],
  "Clubs Low": [{ set: "clubs", values: ["2", "3", "4", "5", "6", "7"] }],
  "Clubs High": [{ set: "clubs", values: ["9", "10", "J", "Q", "K", "A"] }],
  "Diamonds Low": [{ set: "diamonds", values: ["2", "3", "4", "5", "6", "7"] }],
  "Diamonds High": [{ set: "diamonds", values: ["9", "10", "J", "Q", "K", "A"] }],
  "8s and Jokers": [
    { set: "spades", values: ["8"] }, { set: "hearts", values: ["8"] },
    { set: "clubs", values: ["8"] }, { set: "diamonds", values: ["8"] },
    { set: "jokers", values: ["RJ", "BJ"] },
  ],
};

// Helper function to determine which askable set a card belongs to
function getAskableSetForClientCard(card: Card): string | null {
  for (const [setName, setParts] of Object.entries(ALL_ASKABLE_SETS_CONFIG)) {
    for (const part of setParts) {
      if (part.set === card.set && part.values.includes(card.value)) {
        return setName; // Returns the display name like "Spades Low"
      }
    }
  }
  return null;
}

const cardValueDisplay: Record<string, string> = {
  "A": "Ace", "K": "King", "Q": "Queen", "J": "Jack", "10": "10",
  "9": "9", "8": "8", "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2",
  "RJ": "Red Joker", "BJ": "Black Joker"
};

export default function AskModal({ player, onClose, onAsk, myCards }: AskModalProps) {
  const [selectedAskableSetName, setSelectedAskableSetName] = useState<string>("");
  const [selectedCardToAsk, setSelectedCardToAsk] = useState<Card | null>(null);

  // Determine the unique askable sets the player has cards from
  const myAvailableAskableSets = Array.from(
    new Set(myCards.map(card => getAskableSetForClientCard(card)).filter(Boolean) as string[])
  ).sort(); // Sort for consistent order

  // Determine the cards available to ask for from the selected askable set
  let askableCardsInSelectedSet: Card[] = [];
  if (selectedAskableSetName && ALL_ASKABLE_SETS_CONFIG[selectedAskableSetName]) {
    const allCardsInThisSet: Card[] = [];
    ALL_ASKABLE_SETS_CONFIG[selectedAskableSetName].forEach(part => {
      part.values.forEach(val => {
        allCardsInThisSet.push({ set: part.set, value: val });
      });
    });

    // Filter out cards the player already has from this set
    askableCardsInSelectedSet = allCardsInThisSet.filter(
      (theoreticalCard) => 
        !myCards.some(
          (heldCard) => heldCard.set === theoreticalCard.set && heldCard.value === theoreticalCard.value
        )
    ).sort((a,b) => {
      // Sort cards for display, e.g., by standard card order if possible
      const valueOrder = ["2","3","4","5","6","7","8","9","10","J","Q","K","A","BJ","RJ"];
      if (a.set !== b.set) return a.set.localeCompare(b.set);
      return valueOrder.indexOf(a.value) - valueOrder.indexOf(b.value);
    });
  }

  const handleAskButtonClick = () => {
    if (selectedCardToAsk) {
      onAsk(selectedCardToAsk);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Ask {player.name} for a card</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Set:</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedAskableSetName}
            onChange={(e) => {
              setSelectedAskableSetName(e.target.value);
              setSelectedCardToAsk(null); // Reset card selection when set changes
            }}
          >
            <option value="">Select a set</option>
            {myAvailableAskableSets.map((setName) => (
              <option key={setName} value={setName}>
                {setName} {/* Display name like "Spades Low" */}
              </option>
            ))}
          </select>
        </div>

        {selectedAskableSetName && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Card:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedCardToAsk ? `${selectedCardToAsk.set}-${selectedCardToAsk.value}` : ""}
              onChange={(e) => {
                const [set, value] = e.target.value.split("-");
                if (set && value) {
                  setSelectedCardToAsk({ set, value });
                } else {
                  setSelectedCardToAsk(null);
                }
              }}
            >
              <option value="">Select a card</option>
              {askableCardsInSelectedSet.map((card) => {
                const displayValue = cardValueDisplay[card.value] || card.value;
                const displayText = card.set.toLowerCase() === "jokers" 
                  ? displayValue 
                  : `${displayValue} of ${card.set.charAt(0).toUpperCase() + card.set.slice(1)}`;
                
                return (
                  <option key={`${card.set}-${card.value}`} value={`${card.set}-${card.value}`}>
                    {displayText}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">
            Cancel
          </button>
          <button
            onClick={handleAskButtonClick}
            disabled={!selectedCardToAsk}
            className={`px-4 py-2 rounded-md text-white ${
              selectedCardToAsk ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"
            }`}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
