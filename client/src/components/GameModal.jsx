import { useEffect, useState } from "react";

function GameModal({ gameId, onClose }) {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState("All");

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const res = await fetch(`https://localhost:7119/api/game/${gameId}/data`);
        if (!res.ok) throw new Error("Failed to fetch game data.");
        const data = await res.json();
        setGameData({
          ...data,
          players: data.players || data.Players || [],
        });
      } catch (err) {
        console.error("Error fetching game data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      setLoading(true);
      setGameData(null);
      fetchGameData();
      setSelectedTeam("All");
    }
  }, [gameId]);

  if (!gameId) return null;

  const filteredPlayers = () => {
    if (!gameData || !gameData.players) return [];
    let players = gameData.players;
    if (selectedTeam !== "All") {
      players = players.filter((player) => player.team === selectedTeam);
    }
    return [...players].sort((a, b) => b.points - a.points);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F1B33] text-white rounded-lg shadow-lg max-w-6xl w-full p-6 relative overflow-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl font-bold"
        >
          ×
        </button>

        {loading ? (
          <p className="text-center text-gray-300">Loading game data...</p>
        ) : gameData ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">
              {gameData.homeTeam} vs {gameData.awayTeam}
            </h2>
            <p className="text-center text-gray-400 text-lg mb-6">
              Final Score: {gameData.homeScore} - {gameData.awayScore}
            </p>

            <div className="flex justify-start gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSelectedTeam("All")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  selectedTeam === "All" ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                All Players
              </button>
              <button
                onClick={() => setSelectedTeam(gameData.homeTeam)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  selectedTeam === gameData.homeTeam ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {gameData.homeTeam}
              </button>
              <button
                onClick={() => setSelectedTeam(gameData.awayTeam)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  selectedTeam === gameData.awayTeam ? "bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {gameData.awayTeam}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#0F1B33] text-white rounded-lg text-xs">
                <thead className="bg-[#1E293B]">
                  <tr>
                    <th className="px-2 py-3 text-left">Name</th>
                    <th className="px-2 py-3 text-center">PTS</th>
                    <th className="px-2 py-3 text-center">REB</th>
                    <th className="px-2 py-3 text-center">AST</th>
                    <th className="px-2 py-3 text-center">MIN</th>
                    <th className="px-2 py-3 text-center">FGM</th>
                    <th className="px-2 py-3 text-center">FGA</th>
                    <th className="px-2 py-3 text-center">FTM</th>
                    <th className="px-2 py-3 text-center">FTA</th>
                    <th className="px-2 py-3 text-center">STL</th>
                    <th className="px-2 py-3 text-center">BLK</th>
                    <th className="px-2 py-3 text-center">TO</th>
                    <th className="px-2 py-3 text-center">FOULS</th>
                    <th className="px-2 py-3 text-center">FPTS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers().length > 0 ? (
                    filteredPlayers().map((player) => (
                      <tr key={player.playerId} className="border-t border-slate-700 hover:bg-slate-800">
                        <td className="px-2 py-2">{player.firstName} {player.lastName}</td>
                        <td className="px-2 py-2 text-center">{player.points}</td>
                        <td className="px-2 py-2 text-center">{player.rebounds}</td>
                        <td className="px-2 py-2 text-center">{player.assists}</td>
                        <td className="px-2 py-2 text-center">{player.minutesPlayed}</td>
                        <td className="px-2 py-2 text-center">{player.fgm}</td>
                        <td className="px-2 py-2 text-center">{player.fga}</td>
                        <td className="px-2 py-2 text-center">{player.ftm}</td>
                        <td className="px-2 py-2 text-center">{player.fta}</td>
                        <td className="px-2 py-2 text-center">{player.steals}</td>
                        <td className="px-2 py-2 text-center">{player.blocks}</td>
                        <td className="px-2 py-2 text-center">{player.turnovers}</td>
                        <td className="px-2 py-2 text-center">{player.fouls}</td>
                        <td className="px-2 py-2 text-center">{player.fantasyPoints?.toFixed(1)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-center text-gray-400" colSpan="14">
                        No players found for this team.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-300">No game data available.</p>
        )}
      </div>
    </div>
  );
}

export default GameModal;
