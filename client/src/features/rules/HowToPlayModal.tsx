import type React from "react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#f5f0e1] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b2b25] hover:text-[#5a241f] text-3xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="text-3xl font-serif text-[#6b2b25] mb-6 text-center">How to Play Literature</h2>

        <div className="space-y-6 text-[#6b2b25] font-sans">
          <p className="text-lg">
            Literature is a strategic card game of memory, teamwork, and detective skills where two teams compete to collect card sets. Here's how it works:
          </p>

          <section>
            <h3 className="text-2xl font-serif text-[#5a241f] mb-2">Setup</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>6 players split into 2 teams of 3</li>
              <li>Uses a standard 52-card deck plus 2 jokers (54 cards total)</li>
              <li>Each player receives 9 cards</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-serif text-[#5a241f] mb-2">Card Sets</h3>
            <p className="mb-2">There are 9 sets to collect:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <li>Low Spades: 2-7 of Spades</li>
              <li>High Spades: 9-Ace of Spades</li>
              <li>Low Hearts: 2-7 of Hearts</li>
              <li>High Hearts: 9-Ace of Hearts</li>
              <li>Low Diamonds: 2-7 of Diamonds</li>
              <li>High Diamonds: 9-Ace of Diamonds</li>
              <li>Low Clubs: 2-7 of Clubs</li>
              <li>High Clubs: 9-Ace of Clubs</li>
              <li>Eights & Jokers: All four 8s plus Red and Black Jokers</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-serif text-[#5a241f] mb-2">Gameplay</h3>
            <p className="mb-2">On your turn, you can:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Ask for a card</strong> from an opponent who still has cards. You can only ask for a card if:
                <ul className="list-circle list-inside space-y-1 pl-6 mt-1">
                  <li>You already have at least one card from that set</li>
                  <li>You don't already have the card you're asking for</li>
                </ul>
              </li>
              <li>If they have the card, they must give it to you and you get another turn.</li>
              <li>If they don't have it, your turn ends and they go next.</li>
              <li>
                <strong>Declare a set</strong> if you think your team collectively has all cards in a set. You must specify exactly which teammate has which card. If correct, your team wins the set. If wrong, the opposing team gets the set.
              </li>
              <li>If you declare and consequently run out of cards, the turn goes to the last player that asked a question that still has cards.</li>
              <li>The last asked question is always known and is displayed at the bottom of the screen.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-serif text-[#5a241f] mb-2">Winning</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>First team to collect 5 sets wins</li>
              <li>The game ends when all cards are played or a team wins 5 sets</li>
              <li>If a player runs out of cards, they can no longer ask or be asked for cards</li>
              <li>If all opponents run out of cards, your team must declare remaining sets until a team reaches 5</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-serif text-[#5a241f] mb-2">Strategy Tips</h3>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Pay attention to which cards your teammates ask for</li>
              <li>Keep track of which cards opponents have asked about</li>
              <li>Communicate with your team through your card requests</li>
            </ul>
          </section>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#6b2b25] hover:bg-[#5a241f] text-white rounded-md text-lg transition-colors font-serif"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayModal; 