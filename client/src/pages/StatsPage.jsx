import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";

function StatsPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [sortBy, setSortBy] = useState("fantasyPoints");
  const [sortDirection, setSortDirection] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const playersPerPage = 20;
  const [selectedPositions, setSelectedPositions] = useState({
    G: true,
    F: true,
    C: true,
  });
  const handlePositionChange = (position) => {
    setSelectedPositions((prev) => ({
      ...prev,
      [position]: !prev[position],
    }));
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("https://localhost:7119/api/players");
        const allPlayers = await res.json();

        const withStats = await Promise.all(
          allPlayers.map(async (player) => {
            try {
              const statRes = await fetch(
                `https://localhost:7119/api/players/${player.id}/averages`
              );
              if (!statRes.ok) return null;

              const averages = await statRes.json();
              if (!averages || averages.points === 0) return null;

              return { ...player, averages };
            } catch {
              return null;
            }
          })
        );

        setPlayers(withStats.filter(Boolean));
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  const filteredPlayers = players.filter((player) => {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPositions[player.position];
    return matchesSearch && matchesPosition;
  });


  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const indexOfLast = currentPage * playersPerPage;
  const indexOfFirst = indexOfLast - playersPerPage;


  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const valA =
      sortBy === "fg"
        ? a.averages.fieldGoalPercentage
        : sortBy === "ft"
          ? a.averages.freeThrowPercentage
          : a.averages[sortBy];

    const valB =
      sortBy === "fg"
        ? b.averages.fieldGoalPercentage
        : sortBy === "ft"
          ? b.averages.freeThrowPercentage
          : b.averages[sortBy];

    if (valA === undefined || valB === undefined) return 0;
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const currentPlayers = sortedPlayers.slice(indexOfFirst, indexOfLast);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPaginationNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
    return pages;
  };

  const getTeamLogoUrl = (teamName) => {
    return `/logos/${teamName.toLowerCase().replace(/\s+/g, "_")}.png`;
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("desc");
    }
  };

  const renderSortArrow = (key) => {
    if (sortBy !== key) return null;
    return <span>{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white">
      <h2 className="text-3xl font-bold mb-6">Player Statistics</h2>
      <div className="mb-4 flex gap-4 text-sm">
        {["G", "F", "C"].map((position) => (
          <label key={position} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPositions[position]}
              onChange={() => handlePositionChange(position)}
              className="accent-orange-500"
            />
            {position}
          </label>
        ))}
      </div>

      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search by player name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 text-white placeholder-gray-400"
        />
      </div>

      {loading ? (
        <p>Loading player stats...</p>
      ) : filteredPlayers.length === 0 ? (
        <p className="text-gray-300">No stats available.</p>
      ) : (
        <>
          <div className="overflow-auto rounded-lg border border-slate-700 shadow">
            <table className="min-w-full bg-[#0F1B33] text-white">
              <thead className="bg-[#1E293B] text-sm">
                <tr>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  {[
                    ["fantasyPoints", "FPTS"],
                    ["points", "PTS"],
                    ["rebounds", "REB"],
                    ["assists", "AST"],
                    ["steals", "STL"],
                    ["blocks", "BLK"],
                    ["turnovers", "TO"],
                    ["minutes", "MIN"],
                    ["fg", "FG%"],
                    ["ft", "FT%"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className="px-4 py-3 cursor-pointer text-center"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{label}</span>
                        {renderSortArrow(key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentPlayers.map((player) => {
                  const { averages } = player;
                  return (
                    <tr
                      key={player.id}
                      className="border-t border-slate-700 hover:bg-slate-800 cursor-pointer"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {player.firstName} {player.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={getTeamLogoUrl(player.team)}
                          alt={player.team}
                          className="w-8 h-8 object-contain"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">{averages.fantasyPoints.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.points.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.rebounds.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.assists.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.steals.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.blocks.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.turnovers.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.minutes.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">{averages.fieldGoalPercentage.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center">{averages.freeThrowPercentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {getPaginationNumbers().map((number, index) =>
              number === "..." ? (
                <span key={`dots-${index}`} className="px-4 py-2 text-sm text-gray-400">...</span>
              ) : (
                <button
                  key={`page-${number}`}
                  onClick={() => paginate(number)}
                  className={`px-4 py-2 text-sm rounded-md border font-semibold ${currentPage === number
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-800 hover:bg-orange-200"
                    }`}
                >
                  {number}
                </button>
              )
            )}
          </div>
        </>
      )}

      {selectedPlayer && (
        <PlayerCard
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

export default StatsPage;
