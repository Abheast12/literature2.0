// Shared types between client and server

export interface Player {
  id: string
  name: string
  isAdmin: boolean
  team: "team1" | "team2" | null
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
  lastAsk?: {
    askingPlayerName: string
    targetPlayerName: string
    card: Card
  }
  lastDeclaration?: DeclarationPopUpDetails | null
}

// New interface for the declaration popup details
export interface DeclarationPopUpDetails {
  id: string; // Unique ID for this declaration event
  declaringPlayerName: string;
  setName: string;
  isOverallCorrect: boolean;
  items: Array<{
    card: Card;                 // A card from the theoretical set
    declaredPlayerName?: string; // Who it was declared for (from the declarations argument)
    actualPlayerName?: string;   // Player on declarer's team who actually had this card before removal
  }>;
  theoreticalCardsInSet: Card[]; // Full list of cards for the set for reference
  awardedToTeam: "team1" | "team2"; // New field to specify which team got the set
}
