import React from "react";
import type { Card, DeclarationPopUpDetails } from "../types";

interface DeclarationResultModalProps {
  details: DeclarationPopUpDetails;
  onClose: () => void;
  formatCardName: (card: Card) => string; // Re-using the card formatting logic
}

const DeclarationResultModal: React.FC<DeclarationResultModalProps> = ({ details, onClose, formatCardName }) => {
  const { declaringPlayerName, setName, isOverallCorrect, items, awardedToTeam } = details;

  // Helper to format the set name for display (e.g., "Spades High" from "spades-high")
  const formatSetName = (sName: string): string => {
    return sName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const awardedTeamName = awardedToTeam === "team1" ? "Blue Team" : "Red Team";
  const awardedTeamBgColor = awardedToTeam === "team1" ? "bg-blue-100 border-blue-300" : "bg-red-100 border-red-300";
  const awardedTeamTextColor = awardedToTeam === "team1" ? "text-blue-700" : "text-red-700";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {declaringPlayerName} {isOverallCorrect ? "Correctly" : "Incorrectly"} Declared {formatSetName(setName)}!
        </h2>

        <div className="overflow-x-auto mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Card
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isOverallCorrect ? "Player" : "Declared Player"}
                </th>
                {!isOverallCorrect && (
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Player
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index} className={!isOverallCorrect && item.declaredPlayerName !== item.actualPlayerName ? "bg-red-100" : ""}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{formatCardName(item.card)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{item.declaredPlayerName || "N/A"}</td>
                  {!isOverallCorrect && (
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{item.actualPlayerName || "N/A"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Unified awarded team message */}
        <div className={`mb-4 p-3 border rounded-md ${awardedTeamBgColor}`}>
            <p className={`text-sm font-semibold ${awardedTeamTextColor}`}>The set was awarded to {awardedTeamName}!</p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DeclarationResultModal; 