"use client"

import type { Card as CardType } from "../types"
import * as deck from '@letele/playing-cards'

interface CardProps {
  card: CardType
  onClick: () => void
  selected?: boolean
  disabled?: boolean
}

// Helper function to get the specific card component from the @letele/playing-cards deck
const getCardComponentFromDeck = (card: CardType): React.FC<React.SVGProps<SVGSVGElement>> | null => {
  const { set, value } = card
  let suitChar = ''
  let rankChar = ''

  switch (set.toLowerCase()) {
    case "spades": suitChar = "S"
      break
    case "hearts": suitChar = "H"
      break
    case "clubs": suitChar = "C"
      break
    case "diamonds": suitChar = "D"
      break
    case "jokers":
      // Documentation mentions J1 and J2 for jokers.
      if (value.toUpperCase() === "RJ") return deck.J1
      if (value.toUpperCase() === "BJ") return deck.J2
      return deck.J1 // Default joker
    default: return deck.B1 // Default to a card back if suit is unknown
  }

  switch (value.toUpperCase()) {
    case "A": rankChar = "a"
      break
    case "K": rankChar = "k"
      break
    case "Q": rankChar = "q"
      break
    case "J": rankChar = "j"
      break
    case "10": rankChar = "10"; break;
    // For ranks 2-9, ensure they are lowercase as per library's convention (e.g., S2, H3)
    case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
      rankChar = value.toLowerCase()
      break
    default: 
      console.warn(`Unknown card rank: ${value}. Defaulting to back.`)
      return deck.B1 // Default to a card back if rank is unknown
  }
  
  const cardName = (suitChar + rankChar) as keyof typeof deck
  const CardComponent = deck[cardName]

  if (!CardComponent) {
    console.warn(`Card component not found for ${set} ${value} (mapped to ${cardName}). Defaulting to back.`)
    return deck.B1 // Default to a card back (B1 or B2 are available)
  }
  return CardComponent
}

export default function Card({ card, onClick, selected = false, disabled = false }: CardProps) {
  const CardComponent = getCardComponentFromDeck(card)

  if (!CardComponent) {
    return (
      <div
        className="w-20 h-[calc(1.4*5rem)] bg-gray-300 rounded-md flex items-center justify-center text-xs text-gray-700 shadow-sm"
        title="Unknown Card"
      >
        Error
      </div>
    )
  }

  return (
    <div
      className={`w-20 h-[calc(1.4*5rem)] rounded-md cursor-pointer transition-all shadow-sm inline-block overflow-hidden ${
        selected ? "ring-4 ring-blue-500 shadow-lg transform -translate-y-1" : ""
      } ${disabled ? "cursor-default" : "hover:shadow-md"}`}
      onClick={disabled ? undefined : onClick}
      title={`${card.value} of ${card.set}`}
    >
      <CardComponent style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
