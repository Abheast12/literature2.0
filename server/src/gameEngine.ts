import type { Server } from "socket.io"
import type { Card, GamePlayer, GameState, Player, Set, ServerToClientEvents, ClientToServerEvents } from "./types"

export class GameEngine {
  private games: Record<string, GameState> = {}
  private io: Server<ClientToServerEvents, ServerToClientEvents>
  private allDeclaredSetNames: string[] = [
    "spades-low", "spades-high", "hearts-low", "hearts-high",
    "clubs-low", "clubs-high", "diamonds-low", "diamonds-high",
    "8s_and_jokers"
  ];

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io
  }

  // Added this new helper method
  private getAskableSetForCard(card: Card): string | null {
    for (const setName of this.allDeclaredSetNames) {
      const cardsInSet = this.getSetCardsDefinition(setName);
      if (cardsInSet && cardsInSet.some(c => c.set === card.set && c.value === card.value)) {
        return setName;
      }
    }
    return null; 
  }

  // Create a new game
  createGame(roomCode: string, players: Player[]): void {
    // Shuffle players for random seating and team assignment
    const shuffledPlayers = this.shuffleArray([...players])

    // Create game players with teams (alternating)
    const gamePlayers: GamePlayer[] = shuffledPlayers.map((player, index) => ({
      id: player.id,
      name: player.name,
      team: index % 2 === 0 ? "team1" : "team2",
      cards: [],
    }))

    // Create and shuffle deck
    const deck = this.createDeck()
    this.shuffleArray(deck)

    // Deal cards (9 per player)
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < gamePlayers.length; j++) {
        if (deck.length > 0) {
          gamePlayers[j].cards.push(deck.pop()!)
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
      turnHistory: [], // Initialize turn history
    }

    // Broadcast initial game state to all players
    this.broadcastGameState(roomCode)
  }

  // Check if a game exists
  gameExists(roomCode: string): boolean {
    return !!this.games[roomCode]
  }

  // Get game state for a specific player (hides other players' cards)
  getGameState(roomCode: string, playerId: string): GameState {
    if (!this.games[roomCode]) {
      throw new Error(`Game ${roomCode} does not exist`)
    }

    const gameState = { ...this.games[roomCode] }

    // Hide other players' cards
    gameState.players = gameState.players.map((player) => {
      if (player.id === playerId) {
        return { ...player }
      } else {
        return {
          ...player,
          cards: player.cards.map(() => ({ set: "hidden", value: "hidden" })),
        }
      }
    })

    return gameState
  }

  // Get public game state (for broadcasting)
  getPublicGameState(roomCode: string): GameState {
    if (!this.games[roomCode]) {
      throw new Error(`Game ${roomCode} does not exist`)
    }

    return this.games[roomCode]
  }

  // Broadcast game state to all players
  broadcastGameState(roomCode: string): void {
    if (!this.games[roomCode]) {
      throw new Error(`Game ${roomCode} does not exist`)
    }

    const gameState = this.games[roomCode]

    // Send personalized game state to each player
    gameState.players.forEach((player) => {
      const playerState = this.getGameState(roomCode, player.id)
      this.io.to(player.id).emit("game:stateUpdate", { gameState: playerState })
    })
  }

  // Ask for a card from another player
  askCard(
    roomCode: string,
    askingPlayerId: string,
    targetPlayerId: string,
    card: Card,
  ): {
    success: boolean
    error?: string
    cardFound: boolean
    askingPlayerName: string
    targetPlayerName: string
  } {
    if (!this.games[roomCode]) {
      return {
        success: false,
        error: "Game does not exist",
        cardFound: false,
        askingPlayerName: "",
        targetPlayerName: "",
      }
    }

    const gameState = this.games[roomCode]

    // Check if it's the asking player's turn
    if (gameState.currentTurn?.playerId !== askingPlayerId) {
      return {
        success: false,
        error: "Not your turn",
        cardFound: false,
        askingPlayerName: "",
        targetPlayerName: "",
      }
    }

    // Get asking player
    const askingPlayer = gameState.players.find((p) => p.id === askingPlayerId)
    if (!askingPlayer) {
      return {
        success: false,
        error: "Asking player not found",
        cardFound: false,
        askingPlayerName: "",
        targetPlayerName: "",
      }
    }

    // Get target player
    const targetPlayer = gameState.players.find((p) => p.id === targetPlayerId)
    if (!targetPlayer) {
      return {
        success: false,
        error: "Target player not found",
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: "",
      }
    }

    // Check if players are on different teams
    if (askingPlayer.team === targetPlayer.team) {
      return {
        success: false,
        error: "Cannot ask a player from your own team",
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      }
    }

    // --- NEW LOGIC FOR CHECKING IF PLAYER HAS A CARD FROM THE SAME ASKABLE SET ---
    const requestedCardAskableSet = this.getAskableSetForCard(card);
    if (!requestedCardAskableSet) {
      // This case should ideally not be reached if client sends valid cards
      return {
        success: false,
        error: "The requested card does not belong to a recognized game set.",
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      };
    }

    const playerHasCardFromSameAskableSet = askingPlayer.cards.some(
      (cardInHand) => this.getAskableSetForCard(cardInHand) === requestedCardAskableSet
    );

    if (!playerHasCardFromSameAskableSet) {
      // Format the set name for better readability in the error message
      const formattedSetName = requestedCardAskableSet.replace(/_/g, " ").replace(/-/g, " ").replace(/\b(\w)/g, c => c.toUpperCase());
      return {
        success: false,
        error: `You must possess a card from the '${formattedSetName}' set to ask for another card from it.`,
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      };
    }
    // --- END OF NEW LOGIC ---

    // Check if asking player already has the card
    const alreadyHasCard = askingPlayer.cards.some((c) => c.set === card.set && c.value === card.value)
    if (alreadyHasCard) {
      return {
        success: false,
        error: "You already have this card",
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      }
    }

    // Check if target player has the card
    const cardIndex = targetPlayer.cards.findIndex((c) => c.set === card.set && c.value === card.value)

    if (cardIndex === -1) {
      // Card not found, turn goes to the target player
      if (gameState.currentTurn) {
        gameState.turnHistory.push(gameState.currentTurn.playerId);
      }
      // Set turn to the target player
      gameState.currentTurn = {
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
      };

      return {
        success: true,
        cardFound: false,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      }
    } else {
      // Card found, transfer it to asking player
      const foundCard = targetPlayer.cards[cardIndex]
      targetPlayer.cards.splice(cardIndex, 1)
      askingPlayer.cards.push(foundCard)

      // Keep the same player's turn

      return {
        success: true,
        cardFound: true,
        askingPlayerName: askingPlayer.name,
        targetPlayerName: targetPlayer.name,
      }
    }
  }

  // Declare a set
  declareSet(
    roomCode: string,
    declaringPlayerId: string,
    setName: string, // e.g., "spades-high", "8s_and_jokers"
    declarations: Record<string, string[]>, // e.g., { "playerId1": ["9S", "TS"], "playerId2": ["JS", "QS", "KS", "AS"] }
  ): {
    success: boolean
    error?: string
    correct: boolean
    playerName: string
    team: "team1" | "team2"
  } {
    if (!this.games[roomCode]) {
      return { success: false, error: "Game does not exist", correct: false, playerName: "", team: "team1" };
    }

    const gameState = this.games[roomCode];
    const declaringPlayer = gameState.players.find((p) => p.id === declaringPlayerId);

    if (!declaringPlayer) {
      return { success: false, error: "Declaring player not found", correct: false, playerName: "", team: "team1" };
    }

    if (gameState.currentTurn?.playerId !== declaringPlayerId) {
      return { success: false, error: "Not your turn", correct: false, playerName: declaringPlayer.name, team: declaringPlayer.team };
    }

    const theoreticalSetCards = this.getSetCardsDefinition(setName);
    if (!theoreticalSetCards) {
      return { success: false, error: "Invalid set name", correct: false, playerName: declaringPlayer.name, team: declaringPlayer.team };
    }

    let isCorrect = true;
    const cardsSuccessfullyClaimed: Card[] = []; // Keep track of cards confirmed by the declaration

    // --- Validation Phase ---
    const allDeclaredCardValuesWithPlayer: { player: GamePlayer, cardValue: string, theoreticalCardMatch?: Card }[] = [];
    
    for (const [playerId, claimedValues] of Object.entries(declarations)) {
      const player = gameState.players.find((p) => p.id === playerId);
      if (!player || player.team !== declaringPlayer.team) {
        isCorrect = false; // Declared player not found or not on the same team
        break;
      }
      for (const claimedValue of claimedValues) {
        allDeclaredCardValuesWithPlayer.push({ player, cardValue: claimedValue });
      }
    }

    if (isCorrect) {
      // Check 1: Each claimed card must exist in the player's hand and be part of the theoretical set
      for (const declaredItem of allDeclaredCardValuesWithPlayer) {
        const { player, cardValue } = declaredItem;
        
        let matchedTheoreticalCard: Card | undefined = undefined;
        if (setName === "8s_and_jokers") {
          matchedTheoreticalCard = theoreticalSetCards.find(tc => tc.value === cardValue);
        } else {
          const suitOfSet = setName.split('-')[0];
          matchedTheoreticalCard = theoreticalSetCards.find(tc => tc.value === cardValue && tc.set === suitOfSet);
        }

        if (!matchedTheoreticalCard) {
          isCorrect = false; // Claimed card value is not part of the theoretical set definition
          break;
        }
        declaredItem.theoreticalCardMatch = matchedTheoreticalCard; // Store for later use/removal

        const playerHasCard = player.cards.some(
          (cardInHand) => cardInHand.set === matchedTheoreticalCard!.set && cardInHand.value === matchedTheoreticalCard!.value
        );

        if (!playerHasCard) {
          isCorrect = false; // Player does not actually have the claimed card
          break;
        }
        cardsSuccessfullyClaimed.push(matchedTheoreticalCard);
      }
    }
    
    if (isCorrect) {
      // Check 2: All cards in the theoretical set must be accounted for by the declaration
      if (cardsSuccessfullyClaimed.length !== theoreticalSetCards.length) {
        isCorrect = false; // Not all cards from the set were declared, or too many cards declared
      } else {
        // Check for uniqueness of claimed cards (e.g. same card not claimed by two players, or twice by one)
        const uniqueClaimedCards = new Set(cardsSuccessfullyClaimed.map(c => `${c.set}-${c.value}`));
        if (uniqueClaimedCards.size !== theoreticalSetCards.length) {
          isCorrect = false; // Duplicate claims for the same physical card or other mismatch
        }
      }
    }

    // --- Outcome Phase ---
    const setForGame: Set = {
      name: setName,
      cards: [...theoreticalSetCards], // Use a copy of theoretical cards for the set object
    };

    // Remove all cards of the declared set from ALL players' hands, regardless of correctness
    gameState.players.forEach(player => {
      player.cards = player.cards.filter(cardInHand => 
        !theoreticalSetCards.some(theoreticalCard => 
          theoreticalCard.set === cardInHand.set && theoreticalCard.value === cardInHand.value
        )
      );
    });

    const declarerAfterCardRemoval = gameState.players.find(p => p.id === declaringPlayerId);

    if (isCorrect) {
      // Award set to declaring team
      if (declaringPlayer.team === "team1") {
        gameState.team1Sets.push(setForGame);
      } else {
        gameState.team2Sets.push(setForGame);
      }
    } else {
      // Award set to opposing team
      if (declaringPlayer.team === "team1") {
        gameState.team2Sets.push(setForGame);
      } else {
        gameState.team1Sets.push(setForGame);
      }
    }
    
    // Turn logic:
    // If declarer still has cards, their turn continues.
    // Otherwise, turn passes to the last player who took a turn and has cards, 
    // or the next player in sequence if no such prior player exists.
    if (declarerAfterCardRemoval && declarerAfterCardRemoval.cards.length > 0) {
      // Declarer has cards, their turn continues.
      // We record this action in turn history if it's a valid turn.
      if (gameState.currentTurn && gameState.currentTurn.playerId === declaringPlayerId) {
        // To avoid duplicate entries if they declare multiple times successfully without cards changing hands for others.
        // We only add if the history's last entry isn't already this player.
        // Or, more simply, we can decide to always add, and the "last active player" logic will just find them again.
        // For now, let's not add to history here, as their turn isn't "passing" yet.
        // The turn officially passes only when nextTurn or nextTurnOrGoToLastActivePlayer is called.
      }
      // Implicitly, currentTurn remains set to declaringPlayer.
    } else {
      // Declarer has no cards, or declarer not found (should not happen here).
      // Add the declarer to history as their turn is now ending.
      if (gameState.currentTurn && gameState.currentTurn.playerId === declaringPlayerId) {
         gameState.turnHistory.push(declaringPlayerId);
      }
      // Check if game ended before calling nextTurn
      const gameHasEnded = gameState.team1Sets.length + gameState.team2Sets.length >= 9 || gameState.players.every((p) => p.cards.length === 0);
      if(!gameHasEnded) {
        this.nextTurnOrGoToLastActivePlayer(roomCode); // New method to implement
      } else {
        gameState.currentTurn = null; // Game ended
      }
    }

    return {
      success: true,
      correct: isCorrect,
      playerName: declaringPlayer.name,
      team: declaringPlayer.team,
    };
  }

  // Modified nextTurn to potentially go to the last active player
  private nextTurnOrGoToLastActivePlayer(roomCode: string): void {
    if (!this.games[roomCode]) {
      return;
    }
    const gameState = this.games[roomCode];
    const numPlayers = gameState.players.length;

    if (numPlayers === 0) {
      gameState.currentTurn = null;
      return;
    }

    // Try to find the last player in turnHistory who still has cards
    if (gameState.turnHistory.length > 0) {
      for (let i = gameState.turnHistory.length - 1; i >= 0; i--) {
        const lastPlayerId = gameState.turnHistory[i];
        const lastPlayer = gameState.players.find(p => p.id === lastPlayerId);
        if (lastPlayer && lastPlayer.cards.length > 0) {
          gameState.currentTurn = {
            playerId: lastPlayer.id,
            playerName: lastPlayer.name,
          };
          // Clear turn history up to this player to prevent cycles if they also run out of cards?
          // Or perhaps only remove this specific entry after using it?
          // For now, let's leave history as is. It represents actual sequence of ended turns.
          return;
        }
      }
    }

    // Fallback: If no suitable player in history, or history is empty,
    // find the next player in sequence from the current (or last known) player.
    let currentPlayerIndex = -1;
    if (gameState.currentTurn) {
      currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentTurn!.playerId);
    } else if (gameState.turnHistory.length > 0) {
      // If currentTurn became null (e.g. game almost ended), try starting from the very last player in history
      const lastPlayerIdInHistory = gameState.turnHistory[gameState.turnHistory.length - 1];
      currentPlayerIndex = gameState.players.findIndex((p) => p.id === lastPlayerIdInHistory);
    }


    if (currentPlayerIndex === -1) {
        // Still no current player, try first player with cards as an absolute fallback.
        for (let i = 0; i < numPlayers; i++) {
            if (gameState.players[i].cards.length > 0) {
                gameState.currentTurn = {
                    playerId: gameState.players[i].id,
                    playerName: gameState.players[i].name,
                };
                return;
            }
        }
        gameState.currentTurn = null; // No player with cards found
        return;
    }
    
    // Iterate to find the next player in sequence with cards
    for (let i = 1; i <= numPlayers; i++) {
      const nextPlayerIndex = (currentPlayerIndex + i) % numPlayers;
      const nextPlayer = gameState.players[nextPlayerIndex];
      if (nextPlayer.cards.length > 0) {
        gameState.currentTurn = {
          playerId: nextPlayer.id,
          playerName: nextPlayer.name,
        };
        return;
      }
    }
    gameState.currentTurn = null; // No player has cards left.
  }

  // Original nextTurn method - can be removed or refactored into nextTurnOrGoToLastActivePlayer
  private nextTurn(roomCode: string): void {
    // This method is now effectively replaced by nextTurnOrGoToLastActivePlayer
    // For safety, it can call the new method, or we can update all call sites.
    // For now, let's have it call the new one to ensure consistency.
    this.nextTurnOrGoToLastActivePlayer(roomCode);
  }

  // Remove a game
  removeGame(roomCode: string): void {
    delete this.games[roomCode]
  }

  // Create a standard deck of cards plus jokers
  private createDeck(): Card[] {
    const suits = ["spades", "hearts", "clubs", "diamonds"]
    const highValues = ["9", "10", "J", "Q", "K", "A"]
    const lowValues = ["2", "3", "4", "5", "6", "7"]
    const eights = ["8"]
    const jokers = ["RJ", "BJ"] // Red Joker, Black Joker

    const deck: Card[] = []

    suits.forEach((suit) => {
      highValues.forEach((value) => deck.push({ set: suit, value }))
      lowValues.forEach((value) => deck.push({ set: suit, value }))
      eights.forEach((value) => deck.push({ set: suit, value }))
    })

    jokers.forEach((value) => deck.push({ set: "jokers", value })) // 'jokers' set for jokers

    return deck
  }

  // Renamed to getSetCardsDefinition to be clear it returns the theoretical definition of a set
  private getSetCardsDefinition(setName: string): Card[] | null {
    const [type, rangeOrSuit] = setName.split("-") // e.g. "spades-high" or "8s_and_jokers"

    if (setName === "8s_and_jokers") {
      return [
        { set: "spades", value: "8" }, { set: "hearts", value: "8" },
        { set: "clubs", value: "8" }, { set: "diamonds", value: "8" },
        { set: "jokers", value: "RJ" }, { set: "jokers", value: "BJ" },
      ]
    }

    const suit = type
    const range = rangeOrSuit
    let values: string[]

    if (range === "low") {
      values = ["2", "3", "4", "5", "6", "7"]
    } else if (range === "high") {
      values = ["9", "10", "J", "Q", "K", "A"]
    } else {
      return null // Invalid range
    }

    // Validate suit
    if (!["spades", "hearts", "clubs", "diamonds"].includes(suit)) {
        return null; // Invalid suit
    }
    
    return values.map((value) => ({ set: suit, value }))
  }

  // Shuffle an array (Fisher-Yates algorithm)
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }
}
