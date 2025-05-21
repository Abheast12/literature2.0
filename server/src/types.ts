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
  turnHistory: string[]
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
    card: Card;
    declaredPlayerName?: string;
    actualPlayerName?: string;
  }>;
  theoreticalCardsInSet: Card[];
  awardedToTeam: "team1" | "team2";
}

// Socket.IO event types
export interface ServerToClientEvents {
  "lobby:playerJoined": (data: { players: Player[] }) => void
  "lobby:playerKicked": (data: { players: Player[] }) => void
  "lobby:kicked": (data: { roomCode: string }) => void
  "lobby:gameStarted": () => void
  "lobby:teamUpdate": (data: { players: Player[] }) => void
  "game:stateUpdate": (data: { gameState: GameState }) => void
  "game:askSuccess": (data: {
    askingPlayer: string
    targetPlayer: string
    card: Card
  }) => void
  "game:askFail": (data: {
    askingPlayer: string
    targetPlayer: string
    card: Card
  }) => void
  "game:declareResult": (data: {
    playerName: string
    setName: string
    success: boolean
    team: "team1" | "team2"
  }) => void
  "game:ended": (data: {
    gameState: GameState
    winner: "team1" | "team2"
  }) => void
}

export interface ClientToServerEvents {
  "lobby:create": (
    data: { username: string; roomCode: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "lobby:join": (
    data: { username: string; roomCode: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "lobby:getPlayers": (
    data: { roomCode: string },
    callback: (response: {
      success: boolean
      error?: string
      players: Player[]
      isAdmin: boolean
    }) => void,
  ) => void
  "lobby:kick": (
    data: { roomCode: string; playerId: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "lobby:start": (
    data: { roomCode: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "lobby:reset": (
    data: { roomCode: string },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "game:getState": (
    data: { roomCode: string },
    callback: (response: {
      success: boolean
      error?: string
      gameState: GameState | null
    }) => void,
  ) => void
  "game:ask": (
    data: { roomCode: string; targetPlayerId: string; card: Card },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "game:declare": (
    data: {
      roomCode: string
      setName: string
      declarations: Record<string, string[]>
    },
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void
  "lobby:assignTeam": (
    data: { roomCode: string; playerId: string; team: "team1" | "team2" },
    callback: (response: { success: boolean; error?: string }) => void
  ) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  name: string
  age: number
}
