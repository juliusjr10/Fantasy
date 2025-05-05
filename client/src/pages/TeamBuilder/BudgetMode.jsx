import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function BudgetMode() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [budget, setBudget] = useState(500);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("fantasyPoints");
  const [sortDirection, setSortDirection] = useState("desc");
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [playerPage, setPlayerPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [fptsRange, setFptsRange] = useState([0, 100]);
  const playersPerPage = 10;
  const [positionFilters, setPositionFilters] = useState({ G: true, F: true, C: true });
  const navigate = useNavigate();
  const maxLimits = { G: 5, F: 5, C: 2 };
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("https://localhost:7119/api/players");
        const allPlayers = await res.json();
        const enriched = await Promise.all(
          allPlayers.map(async (player) => {
            try {
              const avgRes = await fetch(`https://localhost:7119/api/players/${player.id}/averages`);
              const averages = await avgRes.json();
              return { ...player, averages };
            } catch {
              return null;
            }
          })
        );
        setPlayers(enriched.filter(Boolean));
      } catch (err) {
        console.error(err);
      } finally {
      }
    };
    fetchPlayers();
  }, []);
  const handleDeleteTeam = async (teamId) => {
    const confirmed = window.confirm("Are you sure you want to delete your team?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in.");

      const res = await fetch(`https://localhost:7119/api/team/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(await res.text());

      alert("✅ Team deleted successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("https://localhost:7119/api/team/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUserTeams(data);
      } catch (err) {
        console.error("Failed to fetch teams", err);
      }
    };
    fetchTeams();
  }, []);

  const budgetTeam = userTeams.find(t => t.leagueId === 9999);
  if (budgetTeam) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6">💰 Budget Mode</h1>
        <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Budget League Team</h2>
          <ul className="space-y-2">
            <li className="bg-gray-700 px-4 py-2 rounded flex justify-between items-center">
              <span>{budgetTeam.name}</span>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/league/${budgetTeam.leagueId}/teams`)}
                  className="text-sm text-blue-400 hover:underline"
                >
                  View
                </button>
                <button
                  onClick={() => handleDeleteTeam(budgetTeam.id)}
                  className="text-sm text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>

          </ul>
        </div>
      </div>
    );
  }

  const filtered = players.filter(p => {
    const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
    const fpts = p.averages?.fantasyPoints ?? 0;
    const fptsMatch = fpts >= fptsRange[0] && fpts <= fptsRange[1];
    const positionMatch = positionFilters[p.position];
    return nameMatch && priceMatch && fptsMatch && positionMatch;
  });
  

  const sortedPlayers = [...filtered].sort((a, b) => {
    const aVal = sortBy === "price" ? a.price : a.averages?.fantasyPoints ?? 0;
    const bVal = sortBy === "price" ? b.price : b.averages?.fantasyPoints ?? 0;
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const paginatedPlayers = sortedPlayers
    .filter(p => !selectedPlayers.some(sp => sp.id === p.id))
    .slice((playerPage - 1) * playersPerPage, playerPage * playersPerPage);

  const getPaginationNumbers = (currentPage, totalPages) => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const handleAddPlayer = (player) => {

    if (selectedPlayers.length >= 12) return alert("You can only select 12 players.");
    if (selectedPlayers.some(p => p.id === player.id)) return;
    if (budget - player.price < 0) return alert("Not enough budget to add this player.");

    const positionCounts = selectedPlayers.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {});

    if ((positionCounts[player.position] || 0) >= maxLimits[player.position]) {
      return alert(`You can only have ${maxLimits[player.position]} ${player.position === "G" ? "guards" : player.position === "F" ? "forwards" : "centers"}.`);
    }

    setSelectedPlayers([...selectedPlayers, player]);
    setBudget(budget - player.price);
  };


  const handleRemovePlayer = (id) => {
    const player = selectedPlayers.find(p => p.id === id);
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== id));
    setBudget(budget + player.price);
  };

  const handleSubmitTeam = async () => {
    if (!teamName) return alert("❌ Please enter a team name.");
    if (selectedPlayers.length !== 12) return alert("❌ Please select 12 players.");
    const token = localStorage.getItem("token");
    if (!token) return alert("❌ You must be logged in.");
    setSaving(true);
    try {
      const joinRes = await fetch("https://localhost:7119/api/league/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leagueName: "Budget League", password: "string", teamName }),
      });
      if (!joinRes.ok) throw new Error(await joinRes.text());
      const data = await joinRes.json();
      const newTeamId = data.id;
      for (const player of selectedPlayers) {
        const addRes = await fetch("https://localhost:7119/api/team/add-player", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ teamId: newTeamId, playerId: player.id }),
        });
        if (!addRes.ok) throw new Error(await addRes.text());
      }
      alert("Team and players saved successfully!");
      navigate("/league/9999/teams");
    } catch (err) {
      alert("Failed to save team: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">💰 Budget Team Builder</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Available Players</h2>
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4 mb-4">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-1/3 px-4 py-2 rounded border bg-gray-800 border-gray-600"
            />
            <div className="flex gap-4 text-sm text-white mt-2 lg:mt-0">
              {["G", "F", "C"].map((pos) => (
                <label key={pos} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={positionFilters[pos]}
                    onChange={(e) =>
                      setPositionFilters({
                        ...positionFilters,
                        [pos]: e.target.checked,
                      })
                    }
                    className="form-checkbox text-blue-500"
                  />
                  <span>{pos === "G" ? "Guards" : pos === "F" ? "Forwards" : "Centers"}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col w-full lg:w-1/3">
              <label className="text-sm">Max Price: ${priceRange[1]}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                className="w-full"
              />
            </div>

            <div className="flex flex-col w-full lg:w-1/3">
              <label className="text-sm">Max FPTS: {fptsRange[1]}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={fptsRange[1]}
                onChange={(e) => setFptsRange([0, Number(e.target.value)])}
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded border border-gray-700 overflow-x-auto max-w-full">
            <table className="min-w-full table-fixed text-sm bg-gray-800">
              <thead className="bg-gray-700 text-white">
                <tr className="h-14">
                  <th className="px-4 py-2 w-2/6 text-left">Player</th>
                  <th className="px-4 py-2 w-1/6 text-center">Pos</th>
                  <th className="px-4 py-2 w-2/6 text-left">Team</th>
                  <th
                    className="px-4 py-2 w-1/6 text-center cursor-pointer"
                    onClick={() => {
                      setSortBy("fantasyPoints");
                      setSortDirection(
                        sortBy === "fantasyPoints" && sortDirection === "asc" ? "desc" : "asc"
                      );
                    }}
                  >
                    FPTS {sortBy === "fantasyPoints" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-4 py-2 w-1/6 text-center cursor-pointer"
                    onClick={() => {
                      setSortBy("price");
                      setSortDirection(
                        sortBy === "price" && sortDirection === "asc" ? "desc" : "asc"
                      );
                    }}
                  >
                    Price {sortBy === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-2 w-1/6"></th>
                </tr>
              </thead>

              <tbody>
                {paginatedPlayers.map((player) => (
                  <tr key={player.id} className="border-t border-gray-600 h-14">
                    <td className="px-4 py-2 truncate">{player.firstName} {player.lastName}</td>
                    <td className="px-4 py-2 text-center">{player.position}</td>
                    <td className="px-4 py-2 truncate">{player.team}</td>
                    <td className="px-4 py-2 text-center">
                      {player.averages?.fantasyPoints?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-center">${player.price.toFixed(1)}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleAddPlayer(player)}
                        disabled={selectedPlayers.length >= 12}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-4 gap-2 flex-wrap">
            {getPaginationNumbers(playerPage, Math.ceil(sortedPlayers.length / 12)).map(
              (item, index) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-1 text-gray-500 select-none"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${item}`}
                    onClick={() => setPlayerPage(item)}
                    className={`px-4 py-1 rounded border font-medium ${playerPage === item
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-gray-800 hover:bg-violet-100"
                      }`}
                  >
                    {item}
                  </button>
                )
            )}
          </div>
        </div>

        <div>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium">Team Name</label>
            <input
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2 rounded border bg-gray-800 border-gray-600"
            />
            <div className="text-lg font-semibold">
              Budget: <span className="text-green-400">${budget.toFixed(1)}</span>
            </div>
            <button
              onClick={handleSubmitTeam}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {saving ? "Saving..." : "Save Team"}
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">
              Your Team ({selectedPlayers.length}/12)
            </h2>

            {["G", "F", "C"].map((pos) => {
              const label = pos === "G" ? "Guards" : pos === "F" ? "Forwards" : "Centers";
              const playersInPosition = selectedPlayers.filter(p => p.position === pos);

              return (
                <div key={pos} className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{label} ({playersInPosition.length}/{maxLimits[pos]})</h3>
                  {playersInPosition.length === 0 ? (
                    <p className="text-gray-400">No {label.toLowerCase()} selected.</p>
                  ) : (
                    <ul className="space-y-2">
                      {playersInPosition.map((p) => (
                        <li
                          key={p.id}
                          className="bg-gray-700 px-4 py-2 rounded flex justify-between items-center"
                        >
                          <span>
                            {p.firstName} {p.lastName} —{" "}
                            <span className="text-orange-300">${p.price.toFixed(1)}</span>
                          </span>
                          <button
                            onClick={() => handleRemovePlayer(p.id)}
                            className="text-sm text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BudgetMode;
