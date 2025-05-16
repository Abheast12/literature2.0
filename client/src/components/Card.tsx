"use client"

import type { Card as CardType } from "../types"

interface CardProps {
  card: CardType
  onClick: () => void
  selected?: boolean
  disabled?: boolean
}

export default function Card({ card, onClick, selected = false, disabled = false }: CardProps) {
  const { set, value } = card

  // Determine card color based on set
  const getCardColor = () => {
    switch (set) {
      case "spades":
      case "clubs":
        return "text-black"
      case "hearts":
      case "diamonds":
        return "text-red-600"
      case "jokers":
        return "text-purple-600"
      default:
        return "text-black"
    }
  }

  // Get symbol for the suit
  const getSuitSymbol = () => {
    switch (set) {
      case "spades":
        return "♠"
      case "hearts":
        return "♥"
      case "clubs":
        return "♣"
      case "diamonds":
        return "♦"
      case "jokers":
        return "★"
      default:
        return ""
    }
  }

  // Format the card value
  const getFormattedValue = () => {
    switch (value) {
      case "A":
        return "A"
      case "K":
        return "K"
      case "Q":
        return "Q"
      case "J":
        return "J"
      case "joker":
        return "JOKER"
      default:
        return value
    }
  }

  const cardColor = getCardColor()
  const suitSymbol = getSuitSymbol()
  const formattedValue = getFormattedValue()

  return (
    <div
      className={`w-14 h-20 bg-white rounded-md border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
        selected ? "border-blue-500 shadow-md transform -translate-y-2" : "border-gray-300"
      } ${disabled ? "opacity-70 cursor-default" : "hover:shadow-md"}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className={`text-xs font-bold ${cardColor}`}>{formattedValue}</div>
      <div className={`text-xl ${cardColor}`}>{suitSymbol}</div>
      <div className={`text-xs font-bold ${cardColor} rotate-180`}>{formattedValue}</div>
    </div>
  )
}
