import type { Player } from "./types"

interface Lobby {
  roomCode: string
  adminId: string
  players: string[]
  playerNames: Record<string, string>
  playerTeams: Record<string, "team1" | "team2" | null>
  gameStarted: boolean
}

export class LobbyManager {
  private lobbies: Record<string, Lobby> = {}

  // Create a new lobby
  createLobby(roomCode: string, adminId: string, adminName: string): void {
    this.lobbies[roomCode] = {
      roomCode,
      adminId,
      players: [adminId],
      playerNames: { [adminId]: adminName },
      playerTeams: { [adminId]: "team1" },
      gameStarted: false,
    }
  }

  // Check if a lobby exists
  lobbyExists(roomCode: string): boolean {
    return !!this.lobbies[roomCode]
  }

  // Get a lobby by room code
  getLobby(roomCode: string): Lobby {
    if (!this.lobbies[roomCode]) {
      throw new Error(`Lobby ${roomCode} does not exist`)
    }
    return this.lobbies[roomCode]
  }

  // Add a player to a lobby
  addPlayerToLobby(roomCode: string, playerId: string, playerName: string): void {
    const lobby = this.getLobby(roomCode)

    if (lobby.players.includes(playerId)) {
      return // Player already in lobby
    }

    lobby.players.push(playerId)
    lobby.playerNames[playerId] = playerName
    const team = lobby.players.length % 2 === 1 ? "team1" : "team2"
    lobby.playerTeams[playerId] = team
  }

  // Remove a player from a lobby
  removePlayerFromLobby(roomCode: string, playerId: string): void {
    const lobby = this.getLobby(roomCode)

    lobby.players = lobby.players.filter((id) => id !== playerId)
    delete lobby.playerNames[playerId]
    delete lobby.playerTeams[playerId]

    // If no players left, remove the lobby
    if (lobby.players.length === 0) {
      this.removeLobby(roomCode)
    }
  }

  // Get all players in a lobby
  getLobbyPlayers(roomCode: string): Player[] {
    const lobby = this.getLobby(roomCode)

    return lobby.players.map((playerId) => ({
      id: playerId,
      name: lobby.playerNames[playerId],
      isAdmin: playerId === lobby.adminId,
      team: lobby.playerTeams[playerId] || null,
    }))
  }

  // Set a new admin for a lobby
  setNewAdmin(roomCode: string, newAdminId: string): void {
    const lobby = this.getLobby(roomCode)

    if (!lobby.players.includes(newAdminId)) {
      throw new Error(`Player ${newAdminId} is not in lobby ${roomCode}`)
    }

    lobby.adminId = newAdminId
  }

  // Assign a player to a specific team
  assignPlayerTeam(roomCode: string, playerId: string, team: "team1" | "team2"): void {
    const lobby = this.getLobby(roomCode)

    if (!lobby.players.includes(playerId)) {
      throw new Error(`Player ${playerId} is not in lobby ${roomCode}`)
    }

    lobby.playerTeams[playerId] = team
  }

  // Start a game in a lobby
  startGame(roomCode: string): void {
    const lobby = this.getLobby(roomCode)
    lobby.gameStarted = true
  }

  // Reset a game in a lobby
  resetGame(roomCode: string): void {
    const lobby = this.getLobby(roomCode)
    lobby.gameStarted = false
  }

  // Remove a lobby
  removeLobby(roomCode: string): void {
    delete this.lobbies[roomCode]
  }

  // Get all lobbies that a player is in
  getLobbiesWithPlayer(playerId: string): string[] {
    return Object.keys(this.lobbies).filter((roomCode) => this.lobbies[roomCode].players.includes(playerId))
  }
}
