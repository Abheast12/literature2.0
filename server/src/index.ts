import express from "express"
import http from "http"
import { Server } from "socket.io"
import path from "path"
import { LobbyManager } from "./lobbies"
import { GameEngine } from "./gameEngine"
import type { ClientToServerEvents, ServerToClientEvents, Player } from "./types"

// Create Express app
const app = express()
const server = http.createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : "http://localhost:5173",
    methods: ["GET", "POST"],
  },
})

// Initialize managers
const lobbyManager = new LobbyManager()
const gameEngine = new GameEngine(io)

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../client/dist")))

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist/index.html"))
  })
}

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Lobby events
  socket.on("lobby:create", (data, callback) => {
    try {
      const { username, roomCode } = data

      if (!username || !roomCode) {
        return callback({ success: false, error: "Username and room code are required" })
      }

      if (lobbyManager.lobbyExists(roomCode)) {
        return callback({ success: false, error: "Room already exists" })
      }

      lobbyManager.createLobby(roomCode, socket.id, username)
      socket.join(roomCode)

      callback({ success: true })
    } catch (error) {
      console.error("Error creating lobby:", error)
      callback({ success: false, error: "Failed to create lobby" })
    }
  })

  socket.on("lobby:join", (data, callback) => {
    try {
      const { username, roomCode } = data

      if (!username || !roomCode) {
        return callback({ success: false, error: "Username and room code are required" })
      }

      if (!lobbyManager.lobbyExists(roomCode)) {
        return callback({ success: false, error: "Room does not exist" })
      }

      const lobby = lobbyManager.getLobby(roomCode)

      if (lobby.players.length >= 6) {
        return callback({ success: false, error: "Room is full" })
      }

      if (lobby.gameStarted) {
        return callback({ success: false, error: "Game already started" })
      }

      lobbyManager.addPlayerToLobby(roomCode, socket.id, username)
      socket.join(roomCode)

      // Notify all players in the lobby
      io.to(roomCode).emit("lobby:playerJoined", {
        players: lobbyManager.getLobbyPlayers(roomCode),
      })

      callback({ success: true })
    } catch (error) {
      console.error("Error joining lobby:", error)
      callback({ success: false, error: "Failed to join lobby" })
    }
  })

  socket.on("lobby:getPlayers", (data, callback) => {
    try {
      const { roomCode } = data

      if (!lobbyManager.lobbyExists(roomCode)) {
        return callback({
          success: false,
          error: "Room does not exist",
          players: [],
          isAdmin: false,
        })
      }

      const lobby = lobbyManager.getLobby(roomCode)
      const isAdmin = lobby.adminId === socket.id

      callback({
        success: true,
        players: lobbyManager.getLobbyPlayers(roomCode),
        isAdmin,
      })
    } catch (error) {
      console.error("Error getting lobby players:", error)
      callback({
        success: false,
        error: "Failed to get lobby players",
        players: [],
        isAdmin: false,
      })
    }
  })

  socket.on("lobby:kick", (data, callback) => {
    try {
      const { roomCode, playerId } = data

      if (!lobbyManager.lobbyExists(roomCode)) {
        return callback({ success: false, error: "Room does not exist" })
      }

      const lobby = lobbyManager.getLobby(roomCode)

      if (lobby.adminId !== socket.id) {
        return callback({ success: false, error: "Only admin can kick players" })
      }

      if (playerId === lobby.adminId) {
        return callback({ success: false, error: "Admin cannot kick themselves" })
      }

      lobbyManager.removePlayerFromLobby(roomCode, playerId)

      // Notify the kicked player
      io.to(playerId).emit("lobby:kicked", { roomCode })

      // Remove the player from the room
      const kickedSocket = io.sockets.sockets.get(playerId)
      if (kickedSocket) {
        kickedSocket.leave(roomCode)
      }

      // Notify remaining players
      io.to(roomCode).emit("lobby:playerKicked", {
        players: lobbyManager.getLobbyPlayers(roomCode),
      })

      callback({ success: true })
    } catch (error) {
      console.error("Error kicking player:", error)
      callback({ success: false, error: "Failed to kick player" })
    }
  })

  socket.on("lobby:start", (data, callback) => {
    try {
      const { roomCode } = data

      if (!lobbyManager.lobbyExists(roomCode)) {
        return callback({ success: false, error: "Room does not exist" })
      }

      const lobby = lobbyManager.getLobby(roomCode)

      if (lobby.adminId !== socket.id) {
        return callback({ success: false, error: "Only admin can start the game" })
      }

      if (lobby.players.length !== 6) {
        return callback({ success: false, error: "Need exactly 6 players to start" })
      }

      // Start the game
      lobbyManager.startGame(roomCode)
      
      // Convert player IDs to Player objects
      const players: Player[] = lobby.players.map(playerId => ({
        id: playerId,
        name: lobby.playerNames[playerId] || 'Unknown Player',
        isAdmin: playerId === lobby.adminId
      }))
      
      gameEngine.createGame(roomCode, players)

      // Notify all players
      io.to(roomCode).emit("lobby:gameStarted")

      callback({ success: true })
    } catch (error) {
      console.error("Error starting game:", error)
      callback({ success: false, error: "Failed to start game" })
    }
  })

  socket.on("lobby:reset", (data, callback) => {
    try {
      const { roomCode } = data

      if (!lobbyManager.lobbyExists(roomCode)) {
        return callback({ success: false, error: "Room does not exist" })
      }

      // Reset the game state
      lobbyManager.resetGame(roomCode)
      gameEngine.removeGame(roomCode)

      callback({ success: true })
    } catch (error) {
      console.error("Error resetting game:", error)
      callback({ success: false, error: "Failed to reset game" })
    }
  })

  // Game events
  socket.on("game:getState", (data, callback) => {
    try {
      const { roomCode } = data

      if (!gameEngine.gameExists(roomCode)) {
        return callback({
          success: false,
          error: "Game does not exist",
          gameState: null,
        })
      }

      const gameState = gameEngine.getGameState(roomCode, socket.id)

      callback({
        success: true,
        gameState,
      })
    } catch (error) {
      console.error("Error getting game state:", error)
      callback({
        success: false,
        error: "Failed to get game state",
        gameState: null,
      })
    }
  })

  socket.on("game:ask", (data, callback) => {
    try {
      const { roomCode, targetPlayerId, card } = data

      if (!gameEngine.gameExists(roomCode)) {
        return callback({ success: false, error: "Game does not exist" })
      }

      const result = gameEngine.askCard(roomCode, socket.id, targetPlayerId, card)

      if (!result.success) {
        return callback({ success: false, error: result.error })
      }

      // Update all players with the new game state
      gameEngine.broadcastGameState(roomCode)

      // If the ask was successful, notify players
      if (result.cardFound) {
        io.to(roomCode).emit("game:askSuccess", {
          askingPlayer: result.askingPlayerName,
          targetPlayer: result.targetPlayerName,
          card: card,
        })
      } else {
        io.to(roomCode).emit("game:askFail", {
          askingPlayer: result.askingPlayerName,
          targetPlayer: result.targetPlayerName,
          card: card,
        })
      }

      callback({ success: true })
    } catch (error) {
      console.error("Error asking for card:", error)
      callback({ success: false, error: "Failed to ask for card" })
    }
  })

  socket.on("game:declare", (data, callback) => {
    try {
      const { roomCode, setName, declarations } = data

      if (!gameEngine.gameExists(roomCode)) {
        return callback({ success: false, error: "Game does not exist" })
      }

      const result = gameEngine.declareSet(roomCode, socket.id, setName, declarations)

      if (!result.success) {
        return callback({ success: false, error: result.error })
      }

      // Update all players with the new game state
      gameEngine.broadcastGameState(roomCode)

      // Notify players about the declaration result
      io.to(roomCode).emit("game:declareResult", {
        playerName: result.playerName,
        setName: setName,
        success: result.correct,
        team: result.team,
      })

      // Check if the game has ended
      const gameState = gameEngine.getPublicGameState(roomCode)
      const gameEnded =
        gameState.team1Sets.length + gameState.team2Sets.length >= 9 ||
        gameState.players.every((p) => p.cards.length === 0)

      if (gameEnded) {
        const winner = gameState.team1Sets.length > gameState.team2Sets.length ? "team1" : "team2"
        io.to(roomCode).emit("game:ended", {
          gameState: gameState,
          winner: winner,
        })
      }

      callback({ success: true })
    } catch (error) {
      console.error("Error declaring set:", error)
      callback({ success: false, error: "Failed to declare set" })
    }
  })

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)

    // Handle player leaving lobbies
    const lobbies = lobbyManager.getLobbiesWithPlayer(socket.id)

    lobbies.forEach((roomCode) => {
      const lobby = lobbyManager.getLobby(roomCode)

      // If the admin disconnects, assign a new admin or close the lobby
      if (lobby.adminId === socket.id) {
        if (lobby.players.length > 1) {
          // Assign the next player as admin
          const newAdminId = lobby.players.find((p) => p !== socket.id)
          if (newAdminId) {
            lobbyManager.setNewAdmin(roomCode, newAdminId)
          }
        } else {
          // Close the lobby if no players left
          lobbyManager.removeLobby(roomCode)
          gameEngine.removeGame(roomCode)
          return
        }
      }

      // Remove the player from the lobby
      lobbyManager.removePlayerFromLobby(roomCode, socket.id)

      // Notify remaining players
      io.to(roomCode).emit("lobby:playerKicked", {
        players: lobbyManager.getLobbyPlayers(roomCode),
      })
    })
  })
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
