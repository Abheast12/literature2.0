import type { Set } from "../types"

interface CapturedSetsProps {
  sets: Set[]
  teamName: string
  teamId: "team1" | "team2"
}

export default function CapturedSets({ sets, teamName, teamId }: CapturedSetsProps) {
  const teamColor = teamId === "team1" ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"

  return (
    <div className={`${teamColor} border-2 rounded-lg p-3 w-32`}>
      <h3 className="text-center font-medium mb-2">{teamName}</h3>
      <div className="flex flex-col gap-1">
        {sets.length === 0 ? (
          <div className="text-center text-sm text-gray-500">No sets</div>
        ) : (
          sets.map((set) => (
            <div key={set.name} className="text-sm text-center bg-white/80 rounded-md py-1">
              {set.name}
            </div>
          ))
        )}
      </div>
      <div className="text-center font-bold mt-2">{sets.length}/9</div>
    </div>
  )
}
