import { create } from "zustand"
import type { GameState } from "../types"

interface GameStore {
  playerName: string
  gameState: GameState | null
  setPlayerName: (name: string) => void
  setGameState: (state: GameState) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  playerName: "",
  gameState: null,
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => set({ gameState: state }),
  resetGame: () => set({ gameState: null }),
}))
