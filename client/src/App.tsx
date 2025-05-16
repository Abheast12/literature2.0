"use client"

import dynamic from 'next/dynamic'
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

// Use dynamic import with ssr disabled
const App = dynamic(() => Promise.resolve(ClientRouter), {
  ssr: false
})

export default App
