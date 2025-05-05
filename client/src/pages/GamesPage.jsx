import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import GameModal from "../components/GameModal";
import "react-datepicker/dist/react-datepicker.css";

function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGameId, setSelectedGameId] = useState(null);

  const getTeamLogoUrl = (teamName) => {
    if (!teamName) return "/logos/default.png";
    return `/logos/${teamName.toLowerCase().replace(/\s+/g, "_")}.png`;
  };

  const toDateOnly = (date) => date.toISOString().split("T")[0];

  const isAdmin = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return (
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ] === "Admin"
      );
    } catch {
      return false;
    }
  };

  const fetchGamesInRange = async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    try {
      const startStr = toDateOnly(start);
      const endStr = toDateOnly(endDate);

      const url = `https://localhost:7119/api/Game/games/by-date?startDate=${startStr}&endDate=${endStr}`;
      console.log("Fetching games from API:", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("No games found.");

      const data = await res.json();
      console.log("API returned games:", data);

      setGames(
        data.map((g) => ({
          id: g.Id,
          date: g.Date,
          homeTeam: g.HomeTeam,
          awayTeam: g.AwayTeam,
          homeScore: g.HomeScore,
          awayScore: g.AwayScore,
          calculated: g.Calculated,
        }))
      );
    } catch (err) {
      console.error(err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCalculatedGames = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    const startStr = toDateOnly(startDate);
    const endStr = toDateOnly(endDate);

    try {
      setLoading(true);
      let res = await fetch(
        `https://localhost:7119/api/game/update-calculated-games?startDate=${startStr}&endDate=${endStr}`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (!res.ok) throw new Error(await res.text() || "Failed to update games.");

      res = await fetch(
        `https://localhost:7119/api/Team/add-total-points?startDate=${startStr}&endDate=${endStr}`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (!res.ok) throw new Error(await res.text() || "Failed to update team total points.");

      const message = await res.json();
      alert(
        "Points added:\n\n" +
          message.map((t) => `${t.name}: +${t.pointsAdded} (Total: ${t.totalPoints})`).join("\n")
      );

      await fetch(`https://localhost:7119/api/players/update-prices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      fetchGamesInRange(startDate, endDate);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialRange = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://localhost:7119/api/game/calculated-games");
      const data = await res.json();
      console.log("calculated-games payload:", data);

      if (data.length > 0) {
        const rawDate = data[0].Date ?? data[0].date;
        const latestDate = new Date(rawDate);

        if (isNaN(latestDate.getTime())) {
          console.warn("⚠️ Invalid date from API:", rawDate);
          return;
        }

        setStartDate(latestDate);
        setEndDate(latestDate);
        fetchGamesInRange(latestDate, latestDate);
      }
    } catch (err) {
      console.error("Error fetching latest game date:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialRange();
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchGamesInRange(startDate, endDate);
  }, [startDate, endDate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white">
      <h2 className="text-3xl font-bold mb-4">Games</h2>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by team name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 text-white placeholder-gray-400"
        />
        <div className="flex gap-2 items-center">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            className="text-black px-3 py-2 rounded-md"
          />
          <span className="text-gray-300">to</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            dateFormat="yyyy-MM-dd"
            maxDate={new Date()}
            className="text-black px-3 py-2 rounded-md"
          />
        </div>
        {isAdmin() && (
          <button
            onClick={handleUpdateCalculatedGames}
            className="bg-blue-400 hover:bg-blue-500 px-4 py-1 rounded text-white font-semibold shadow"
          >
            Add Games
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading games...</p>
      ) : games.length === 0 ? (
        <p className="text-gray-300">No games found for this date range.</p>
      ) : (
        <div className="overflow-auto rounded-lg border border-slate-700 shadow">
          <table className="min-w-full bg-[#0F1B33] text-white">
            <thead className="bg-[#1E293B] text-sm">
              <tr>
                <th className="px-4 py-3 text-left">Matchup &amp; Date</th>
              </tr>
            </thead>
            <tbody>
              {games
                .filter((g) =>
                  `${g.homeTeam} ${g.awayTeam}`.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((game) => {
                  const clicky = game.calculated;
                  return (
                    <tr
                      key={game.id}
                      onClick={() => clicky && setSelectedGameId(game.id)}
                      className={`border-t border-slate-700 ${
                        clicky ? "hover:bg-slate-800 cursor-pointer" : "opacity-70"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex w-full items-center justify-center gap-2 text-2xl font-medium">
                            <img
                              src={getTeamLogoUrl(game.homeTeam)}
                              alt={game.homeTeam}
                              className="w-6 h-6 object-contain"
                            />
                            <span>{game.homeTeam}</span>
                            {clicky ? (
                              <span className="mx-1 font-bold">
                                {game.homeScore} <span className="text-gray-400">–</span>{" "}
                                {game.awayScore}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">vs</span>
                            )}
                            <span>{game.awayTeam}</span>
                            <img
                              src={getTeamLogoUrl(game.awayTeam)}
                              alt={game.awayTeam}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div className="text-sm text-gray-300 whitespace-nowrap sm:text-right">
                          {new Date(game.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {selectedGameId && (
            <GameModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
          )}
        </div>
      )}
    </div>
  );
}

export default GamesPage;
