// Shared types between client and server

export interface Player {
  id: string
  name: string
  isAdmin: boolean
}

export interface Card {
  set: string
  value: string
}

export interface GamePlayer {
  id: string
  name: string
  team: "team1" | "team2"
  cards: Card[]
}

export interface Set {
  name: string
  cards: Card[]
}

export interface GameState {
  players: GamePlayer[]
  currentTurn: {
    playerId: string
    playerName: string
  } | null
  team1Sets: Set[]
  team2Sets: Set[]
}
