import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import LobbyPage from "./pages/LobbyPage"
import GamePage from "./pages/GamePage"

// Create a client-only version of the Router component
const ClientRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/lobby/:roomCode" element={<LobbyPage />} />
      <Route path="/game/:roomCode" element={<GamePage />} />
    </Routes>
  </Router>
)

export default ClientRouter
