import { io } from "socket.io-client"

// Connect to the server
export const socket = io(process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:3001")

// Setup connection event listeners
socket.on("connect", () => {
  console.log("Connected to server")
})

socket.on("connect_error", (error) => {
  console.error("Connection error:", error)
})

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason)
})
