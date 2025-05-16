# Literature Card Game

A small-scale, in-memory web app for the six-player "Literature" card game.

## Tech Stack

- **Client**: React + TypeScript + Tailwind CSS + Zustand + socket.io-client
- **Server**: Node.js + TypeScript + Express + Socket.IO
- **Deployment**: Single Node process (e.g. Heroku hobby dyno), PM2/Forever auto-restart

## Features

- Lobby system with room codes
- Real-time gameplay with Socket.IO
- Team-based card game with asking and declaring mechanics
- In-memory game state (no database required)

## Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

This will install dependencies for the root project, client, and server.

## Development

To run the development server:

\`\`\`bash
npm run dev
\`\`\`

This will start both the client and server in development mode.

- Client: http://localhost:5173
- Server: http://localhost:3001

## Production

To build for production:

\`\`\`bash
npm run build
\`\`\`

To start the production server:

\`\`\`bash
npm start
\`\`\`

## Game Rules

### Setup
- 6 players divided into 2 teams of 3 players each, seated alternately
- 54-card deck (standard 52 cards + 2 jokers)
- Each player receives 9 cards

### Objective
- Capture sets by correctly declaring the location of all cards in a set
- A team wins by capturing 5 sets or when all hands are empty

### Sets
- Spades (low): A-6 of spades
- Spades (high): 7-K of spades
- Hearts (low): A-6 of hearts
- Hearts (high): 7-K of hearts
- Clubs (low): A-6 of clubs
- Clubs (high): 7-K of clubs
- Diamonds (low): A-6 of diamonds
- Diamonds (high): 7-K of diamonds
- Jokers: 2 jokers

### Gameplay
1. Players take turns asking opponents for cards
2. To ask for a card, you must:
   - Hold at least one card from the same set
   - Not hold the card you're asking for
   - Ask an opponent (not a teammate)
3. If the opponent has the card, they must give it to you and you get another turn
4. If not, your turn ends
5. Players can declare a set when they believe they know where all cards in a set are located among their team
6. A correct declaration captures the set for your team
7. An incorrect declaration gives the set to the opposing team

## Project Structure

\`\`\`
/
├── client/                # React client
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand store
│   │   ├── types.ts       # TypeScript types
│   │   ├── socket.ts      # Socket.IO client setup
│   │   └── App.tsx        # Main app component
│   └── ...
├── server/                # Node.js server
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   ├── lobbies.ts     # Lobby management
│   │   ├── gameEngine.ts  # Game logic
│   │   └── types.ts       # TypeScript types
│   └── ...
└── ...
\`\`\`

## License

MIT
