"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
class GameEngine {
    constructor(io) {
        this.games = {};
        this.io = io;
    }
    // Create a new game
    createGame(roomCode, players) {
        // Shuffle players for random seating and team assignment
        const shuffledPlayers = this.shuffleArray([...players]);
        // Create game players with teams (alternating)
        const gamePlayers = shuffledPlayers.map((player, index) => ({
            id: player.id,
            name: player.name,
            team: index % 2 === 0 ? "team1" : "team2",
            cards: [],
        }));
        // Create and shuffle deck
        const deck = this.createDeck();
        this.shuffleArray(deck);
        // Deal cards (9 per player)
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < gamePlayers.length; j++) {
                if (deck.length > 0) {
                    gamePlayers[j].cards.push(deck.pop());
                }
            }
        }
        // Create initial game state
        this.games[roomCode] = {
            players: gamePlayers,
            currentTurn: {
                playerId: gamePlayers[0].id,
                playerName: gamePlayers[0].name,
            },
            team1Sets: [],
            team2Sets: [],
        };
        // Broadcast initial game state to all players
        this.broadcastGameState(roomCode);
    }
    // Check if a game exists
    gameExists(roomCode) {
        return !!this.games[roomCode];
    }
    // Get game state for a specific player (hides other players' cards)
    getGameState(roomCode, playerId) {
        if (!this.games[roomCode]) {
            throw new Error(`Game ${roomCode} does not exist`);
        }
        const gameState = { ...this.games[roomCode] };
        // Hide other players' cards
        gameState.players = gameState.players.map((player) => {
            if (player.id === playerId) {
                return { ...player };
            }
            else {
                return {
                    ...player,
                    cards: player.cards.map(() => ({ set: "hidden", value: "hidden" })),
                };
            }
        });
        return gameState;
    }
    // Get public game state (for broadcasting)
    getPublicGameState(roomCode) {
        if (!this.games[roomCode]) {
            throw new Error(`Game ${roomCode} does not exist`);
        }
        return this.games[roomCode];
    }
    // Broadcast game state to all players
    broadcastGameState(roomCode) {
        if (!this.games[roomCode]) {
            throw new Error(`Game ${roomCode} does not exist`);
        }
        const gameState = this.games[roomCode];
        // Send personalized game state to each player
        gameState.players.forEach((player) => {
            const playerState = this.getGameState(roomCode, player.id);
            this.io.to(player.id).emit("game:stateUpdate", { gameState: playerState });
        });
    }
    // Ask for a card from another player
    askCard(roomCode, askingPlayerId, targetPlayerId, card) {
        if (!this.games[roomCode]) {
            return {
                success: false,
                error: "Game does not exist",
                cardFound: false,
                askingPlayerName: "",
                targetPlayerName: "",
            };
        }
        const gameState = this.games[roomCode];
        // Check if it's the asking player's turn
        if (gameState.currentTurn?.playerId !== askingPlayerId) {
            return {
                success: false,
                error: "Not your turn",
                cardFound: false,
                askingPlayerName: "",
                targetPlayerName: "",
            };
        }
        // Get asking player
        const askingPlayer = gameState.players.find((p) => p.id === askingPlayerId);
        if (!askingPlayer) {
            return {
                success: false,
                error: "Asking player not found",
                cardFound: false,
                askingPlayerName: "",
                targetPlayerName: "",
            };
        }
        // Get target player
        const targetPlayer = gameState.players.find((p) => p.id === targetPlayerId);
        if (!targetPlayer) {
            return {
                success: false,
                error: "Target player not found",
                cardFound: false,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: "",
            };
        }
        // Check if players are on different teams
        if (askingPlayer.team === targetPlayer.team) {
            return {
                success: false,
                error: "Cannot ask a player from your own team",
                cardFound: false,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: targetPlayer.name,
            };
        }
        // Check if asking player has at least one card from the same set
        const hasCardFromSet = askingPlayer.cards.some((c) => c.set === card.set);
        if (!hasCardFromSet) {
            return {
                success: false,
                error: "You must have at least one card from the same set to ask",
                cardFound: false,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: targetPlayer.name,
            };
        }
        // Check if asking player already has the card
        const alreadyHasCard = askingPlayer.cards.some((c) => c.set === card.set && c.value === card.value);
        if (alreadyHasCard) {
            return {
                success: false,
                error: "You already have this card",
                cardFound: false,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: targetPlayer.name,
            };
        }
        // Check if target player has the card
        const cardIndex = targetPlayer.cards.findIndex((c) => c.set === card.set && c.value === card.value);
        if (cardIndex === -1) {
            // Card not found, move to next player's turn
            this.nextTurn(roomCode);
            return {
                success: true,
                cardFound: false,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: targetPlayer.name,
            };
        }
        else {
            // Card found, transfer it to asking player
            const foundCard = targetPlayer.cards[cardIndex];
            targetPlayer.cards.splice(cardIndex, 1);
            askingPlayer.cards.push(foundCard);
            // Keep the same player's turn
            return {
                success: true,
                cardFound: true,
                askingPlayerName: askingPlayer.name,
                targetPlayerName: targetPlayer.name,
            };
        }
    }
    // Declare a set
    declareSet(roomCode, declaringPlayerId, setName, declarations) {
        if (!this.games[roomCode]) {
            return {
                success: false,
                error: "Game does not exist",
                correct: false,
                playerName: "",
                team: "team1",
            };
        }
        const gameState = this.games[roomCode];
        // Check if it's the declaring player's turn
        if (gameState.currentTurn?.playerId !== declaringPlayerId) {
            return {
                success: false,
                error: "Not your turn",
                correct: false,
                playerName: "",
                team: "team1",
            };
        }
        // Get declaring player
        const declaringPlayer = gameState.players.find((p) => p.id === declaringPlayerId);
        if (!declaringPlayer) {
            return {
                success: false,
                error: "Declaring player not found",
                correct: false,
                playerName: "",
                team: "team1",
            };
        }
        // Get all cards in the set
        const setCards = this.getSetCards(setName);
        if (!setCards) {
            return {
                success: false,
                error: "Invalid set name",
                correct: false,
                playerName: declaringPlayer.name,
                team: declaringPlayer.team,
            };
        }
        // Check if all cards in the set are accounted for in the declarations
        const declaredCards = Object.values(declarations).flat();
        const isComplete = setCards.every((card) => {
            // For jokers, we need exactly 2 declarations (could be the same value twice)
            if (setName === "jokers") {
                return declaredCards.length === 2;
            }
            return declaredCards.includes(card.value);
        });
        if (!isComplete) {
            return {
                success: false,
                error: "Declaration is incomplete",
                correct: false,
                playerName: declaringPlayer.name,
                team: declaringPlayer.team,
            };
        }
        // Check if the declaration is correct
        let isCorrect = true;
        // For each player in the declaration, check if they have the assigned cards
        for (const [playerId, cardValues] of Object.entries(declarations)) {
            const player = gameState.players.find((p) => p.id === playerId);
            if (!player) {
                isCorrect = false;
                break;
            }
            // Check if player is on the same team
            if (player.team !== declaringPlayer.team) {
                return {
                    success: false,
                    error: "Can only declare cards for players on your team",
                    correct: false,
                    playerName: declaringPlayer.name,
                    team: declaringPlayer.team,
                };
            }
            // Check if player has all the assigned cards
            for (const value of cardValues) {
                const hasCard = player.cards.some((c) => c.set === (setName === "jokers" ? "jokers" : setName.split("-")[0]) && c.value === value);
                if (!hasCard) {
                    isCorrect = false;
                    break;
                }
            }
            if (!isCorrect)
                break;
        }
        // Create the set object
        const set = {
            name: setName,
            cards: setCards,
        };
        // Award the set to the appropriate team
        if (isCorrect) {
            // Remove the cards from the players
            for (const [playerId, cardValues] of Object.entries(declarations)) {
                const player = gameState.players.find((p) => p.id === playerId);
                for (const value of cardValues) {
                    const cardIndex = player.cards.findIndex((c) => c.set === (setName === "jokers" ? "jokers" : setName.split("-")[0]) && c.value === value);
                    if (cardIndex !== -1) {
                        player.cards.splice(cardIndex, 1);
                    }
                }
            }
            // Add the set to the team's captured sets
            if (declaringPlayer.team === "team1") {
                gameState.team1Sets.push(set);
            }
            else {
                gameState.team2Sets.push(set);
            }
        }
        else {
            // If incorrect, award the set to the opposing team
            if (declaringPlayer.team === "team1") {
                gameState.team2Sets.push(set);
            }
            else {
                gameState.team1Sets.push(set);
            }
        }
        // Move to next player's turn
        this.nextTurn(roomCode);
        return {
            success: true,
            correct: isCorrect,
            playerName: declaringPlayer.name,
            team: declaringPlayer.team,
        };
    }
    // Move to the next player's turn
    nextTurn(roomCode) {
        if (!this.games[roomCode]) {
            return;
        }
        const gameState = this.games[roomCode];
        if (!gameState.currentTurn) {
            return;
        }
        // Find the current player's index
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentTurn?.playerId);
        if (currentPlayerIndex === -1) {
            return;
        }
        // Move to the next player
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
        const nextPlayer = gameState.players[nextPlayerIndex];
        gameState.currentTurn = {
            playerId: nextPlayer.id,
            playerName: nextPlayer.name,
        };
    }
    // Remove a game
    removeGame(roomCode) {
        delete this.games[roomCode];
    }
    // Create a standard deck of cards plus jokers
    createDeck() {
        const suits = ["spades", "hearts", "clubs", "diamonds"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const deck = [];
        // Add standard cards
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ set: suit, value });
            }
        }
        // Add jokers
        deck.push({ set: "jokers", value: "joker" });
        deck.push({ set: "jokers", value: "joker" });
        return deck;
    }
    // Get all cards in a set
    getSetCards(setName) {
        if (setName === "jokers") {
            return [
                { set: "jokers", value: "joker" },
                { set: "jokers", value: "joker" },
            ];
        }
        const [suit, range] = setName.split("-");
        if (!suit || !range) {
            return null;
        }
        const values = range === "low" ? ["A", "2", "3", "4", "5", "6"] : ["7", "8", "9", "10", "J", "Q", "K"];
        return values.map((value) => ({ set: suit, value }));
    }
    // Shuffle an array (Fisher-Yates algorithm)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
exports.GameEngine = GameEngine;
