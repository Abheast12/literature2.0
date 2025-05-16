"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyManager = void 0;
class LobbyManager {
    constructor() {
        this.lobbies = {};
    }
    // Create a new lobby
    createLobby(roomCode, adminId, adminName) {
        this.lobbies[roomCode] = {
            roomCode,
            adminId,
            players: [adminId],
            playerNames: { [adminId]: adminName },
            gameStarted: false,
        };
    }
    // Check if a lobby exists
    lobbyExists(roomCode) {
        return !!this.lobbies[roomCode];
    }
    // Get a lobby by room code
    getLobby(roomCode) {
        if (!this.lobbies[roomCode]) {
            throw new Error(`Lobby ${roomCode} does not exist`);
        }
        return this.lobbies[roomCode];
    }
    // Add a player to a lobby
    addPlayerToLobby(roomCode, playerId, playerName) {
        const lobby = this.getLobby(roomCode);
        if (lobby.players.includes(playerId)) {
            return; // Player already in lobby
        }
        lobby.players.push(playerId);
        lobby.playerNames[playerId] = playerName;
    }
    // Remove a player from a lobby
    removePlayerFromLobby(roomCode, playerId) {
        const lobby = this.getLobby(roomCode);
        lobby.players = lobby.players.filter((id) => id !== playerId);
        delete lobby.playerNames[playerId];
        // If no players left, remove the lobby
        if (lobby.players.length === 0) {
            this.removeLobby(roomCode);
        }
    }
    // Get all players in a lobby
    getLobbyPlayers(roomCode) {
        const lobby = this.getLobby(roomCode);
        return lobby.players.map((playerId) => ({
            id: playerId,
            name: lobby.playerNames[playerId],
            isAdmin: playerId === lobby.adminId,
        }));
    }
    // Set a new admin for a lobby
    setNewAdmin(roomCode, newAdminId) {
        const lobby = this.getLobby(roomCode);
        if (!lobby.players.includes(newAdminId)) {
            throw new Error(`Player ${newAdminId} is not in lobby ${roomCode}`);
        }
        lobby.adminId = newAdminId;
    }
    // Start a game in a lobby
    startGame(roomCode) {
        const lobby = this.getLobby(roomCode);
        lobby.gameStarted = true;
    }
    // Reset a game in a lobby
    resetGame(roomCode) {
        const lobby = this.getLobby(roomCode);
        lobby.gameStarted = false;
    }
    // Remove a lobby
    removeLobby(roomCode) {
        delete this.lobbies[roomCode];
    }
    // Get all lobbies that a player is in
    getLobbiesWithPlayer(playerId) {
        return Object.keys(this.lobbies).filter((roomCode) => this.lobbies[roomCode].players.includes(playerId));
    }
}
exports.LobbyManager = LobbyManager;
