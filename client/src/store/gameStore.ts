import { create } from "zustand"
import type { GameState } from "../types"

interface GameStore {
  playerName: string | null
  gameState: GameState | null
  setPlayerName: (name: string) => void
  setGameState: (state: GameState | null) => void
  resetGame: () => void
  kickedFromLobbyMessage: string | null
  setKickedFromLobbyMessage: (message: string | null) => void
}

export const useGameStore = create<GameStore>((set) => ({
  playerName: null,
  gameState: null,
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => set({ gameState: state }),
  resetGame: () => set({ gameState: null }),
  kickedFromLobbyMessage: null,
  setKickedFromLobbyMessage: (message) => set({ kickedFromLobbyMessage: message }),
}))
