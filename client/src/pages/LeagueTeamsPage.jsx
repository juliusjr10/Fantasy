import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DraftRoom from "../components/DraftRoom";
import TeamManager from "../components/TeamManager";
import PlayerCard from "../components/PlayerCard";
import Trades from "../components/Trades";
import ForumPosts from "../components/ForumPosts";
function LeagueTeamsPage() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("League");
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [freeAgents, setFreeAgents] = useState([]);
  const [selectedFreeAgent, setSelectedFreeAgent] = useState(null);
  const [freeAgentPage, setFreeAgentPage] = useState(1);
  const [sortBy, setSortBy] = useState("fantasyPoints");
  const [sortDirection, setSortDirection] = useState("desc");
  const [leaguePlayers, setLeaguePlayers] = useState([]);
  const [selectedLeaguePlayer, setSelectedLeaguePlayer] = useState(null);
  const [leagueStatsPage, setLeagueStatsPage] = useState(1);
  const isBudgetLeague = parseInt(leagueId) === 9999;
  const playersPerPage = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [myTeamPlayers, setMyTeamPlayers] = useState([]);
  const [selectedLeagueTeam, setSelectedLeagueTeam] = useState(null);
  const [selectedTeamPlayers, setSelectedTeamPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [playerToAdd, setPlayerToAdd] = useState(null);
  const [playerToRemoveId, setPlayerToRemoveId] = useState(null);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [coinsToSpend, setCoinsToSpend] = useState(10);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        const res = await fetch(`https://localhost:7119/api/league/${leagueId}/teams`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        data.teams.sort((a, b) => b.totalPoints - a.totalPoints);
        setLeague(data);

        const allLeaguePlayers = data.teams.flatMap((team) =>
          team.teamPlayers.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            team: p.team,
            position: p.position,
            price: p.price,
            fantasyTeamName: team.name
          }))
        );
        console.log("Enriched League Players", allLeaguePlayers);

        const enriched = await Promise.all(
          allLeaguePlayers.map(async (p) => {
            try {
              const res = await fetch(`https://localhost:7119/api/players/${p.id}/averages`);
              if (!res.ok) throw new Error("No stats");
              const averages = await res.json();
              return { ...p, averages };
            } catch {
              return {
                ...p,
                averages: {
                  fantasyPoints: 0,
                  points: 0,
                  rebounds: 0,
                  assists: 0,
                  steals: 0,
                  blocks: 0,
                  turnovers: 0,
                  fouls: 0,
                  minutes: 0,
                  fieldGoalPercentage: 0,
                  freeThrowPercentage: 0,
                },
              };
            }
          })
        );
        setLeaguePlayers(enriched);
      } catch (err) {
        console.error("Failed to fetch league data:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeagueData();
  }, [leagueId]);
  function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl relative overflow-auto max-h-[90vh]">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    );
  }

  const getPaginationNumbers = (currentPage, totalPages) => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
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

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const res = await fetch("https://localhost:7119/api/team/my", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setMyTeams(data);
      } catch (err) {
        console.error("Failed to fetch my teams:", err.message);
      }
    };
    fetchMyTeams();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!league || myTeams.length === 0) return;

      const myTeam = myTeams.find((t) => t.leagueId === parseInt(leagueId));
      if (!myTeam) return;

      try {
        const res = await fetch(`https://localhost:7119/api/team/${myTeam.id}/players`);
        const data = await res.json();
        setPlayers(data);
        setMyTeamPlayers(data);
        setSelectedTeam(myTeam.id);
      } catch (err) {
        console.error("Failed to fetch team players:", err.message);
      }
    };
    fetchPlayers();
  }, [activeTab, league, myTeams, leagueId]);

  useEffect(() => {
    const fetchFreeAgents = async () => {
      if (activeTab !== "Free agents") return;
      try {
        let data;
        if (isBudgetLeague) {
          const res = await fetch(`https://localhost:7119/api/players`);
          if (!res.ok) throw new Error(await res.text());
          data = await res.json();
        } else {
          const res = await fetch(`https://localhost:7119/api/players/league/${leagueId}/free-agents`);
          if (!res.ok) throw new Error(await res.text());
          data = await res.json();
        }

        const enriched = await Promise.all(
          data.map(async (p) => {
            try {
              const statsRes = await fetch(`https://localhost:7119/api/players/${p.id}/averages`);
              if (!statsRes.ok) throw new Error("No stats");
              const averages = await statsRes.json();
              return { ...p, averages };
            } catch {
              return {
                ...p,
                averages: {
                  fantasyPoints: 0,
                  points: 0,
                  rebounds: 0,
                  assists: 0,
                  steals: 0,
                  blocks: 0,
                  turnovers: 0,
                  fouls: 0,
                  minutes: 0,
                  fieldGoalPercentage: 0,
                  freeThrowPercentage: 0,
                },
              };
            }
          })
        );

        if (isBudgetLeague) {
          const myTeamPlayerIds = myTeamPlayers.map(p => p.id);
          const filtered = enriched.filter(p => !myTeamPlayerIds.includes(p.id));
          setFreeAgents(filtered);
        } else {
          setFreeAgents(enriched);
        }
      } catch (err) {
        console.error("Failed to fetch free agents:", err.message);
      }
    };

    fetchFreeAgents();
  }, [activeTab, leagueId, myTeamPlayers]);

  const sortedFreeAgents = [...freeAgents].sort((a, b) => {
    const valA = sortBy === "fg"
      ? a.averages.fieldGoalPercentage
      : sortBy === "ft"
        ? a.averages.freeThrowPercentage
        : a.averages[sortBy];
    const valB = sortBy === "fg"
      ? b.averages.fieldGoalPercentage
      : sortBy === "ft"
        ? b.averages.freeThrowPercentage
        : b.averages[sortBy];
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const excludedPlayerIds = isBudgetLeague
    ? myTeamPlayers.map((p) => p.id)
    : league?.teams.flatMap((team) => team.teamPlayers.map((p) => p.id)) || [];

  const filteredFreeAgents = sortedFreeAgents.filter((p) => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotInExcluded = !excludedPlayerIds.includes(p.id);
    return matchesSearch && isNotInExcluded;
  });
  const handleSelectLeagueTeam = async (team) => {
    try {
      const res = await fetch(`https://localhost:7119/api/team/${team.id}/players`);
      if (!res.ok) throw new Error(await res.text());
      const players = await res.json();
      setSelectedTeamPlayers(players);
      setSelectedLeagueTeam(team);
    } catch (err) {
      console.error("Failed to fetch team players:", err.message);
    }
  };

  const currentAgents = filteredFreeAgents.slice(
    (freeAgentPage - 1) * playersPerPage,
    freeAgentPage * playersPerPage
  );

  const handleSubmitRoles = async (updatedPlayers) => {
    for (const p of updatedPlayers) {
      await fetch("https://localhost:7119/api/team/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ teamId: selectedTeam, playerId: p.id, role: p.role }),
      });
    }
    setPlayers(updatedPlayers);
  };

  const tabs = [
    ...(!isBudgetLeague ? ["Draft room"] : []),
    "Team",
    "Stats",
    "League",
    ...(!isBudgetLeague ? ["Trades"] : []),
    "Free agents",
    "Forum"
  ];

  if (loading || !league) {
    return <div className="min-h-screen flex justify-center items-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-6xl mx-auto text-black space-y-8">
        <div className="flex flex-wrap sm:flex-nowrap justify-start sm:justify-between gap-2 overflow-x-auto pb-3 border-b px-2 sm:px-0 w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-semibold ${activeTab === tab
                ? "bg-violet-100 text-violet-700"
                : "text-gray-700 hover:text-violet-600"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <h1 className="text-3xl font-bold">🏆 {league.leagueName}</h1>

        {activeTab === "Draft room" && (
          <DraftRoom leagueId={leagueId} teams={league.teams} />
        )}

        {activeTab === "Team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Team Players</h2>
              {isBudgetLeague && myTeams.length > 0 && (
                <div className="text-gray-700 text-lg">
                  Remaining Budget: ${myTeams.find(t => t.id === selectedTeam)?.budget?.toFixed(1) ?? 'N/A'}
                </div>
              )}

            </div>

            {players.length === 0 ? (
              <p>No players found.</p>
            ) : (
              <TeamManager
                players={players}
                onSubmit={handleSubmitRoles}
                isBudgetLeague={isBudgetLeague}
                starterLimits={{
                  G: myTeams.find(t => t.id === selectedTeam)?.starterG ?? 2,
                  F: myTeams.find(t => t.id === selectedTeam)?.starterF ?? 2,
                  C: myTeams.find(t => t.id === selectedTeam)?.starterC ?? 1,
                }}
                teamId={selectedTeam}
              />


            )}
          </div>
        )}

        {activeTab === "League" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">League Standings</h2>
              <button
                onClick={() => setShowBoostModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold"
              >
                Boost My Team
              </button>
            </div>

            <div className="overflow-auto rounded border">
              <table className="min-w-full bg-white text-gray-800">
                <thead className="bg-orange-100">
                  <tr>
                    <th className="px-6 py-3 text-left">Pos</th>
                    <th className="px-6 py-3 text-left">Team</th>
                    <th className="px-6 py-3 text-left">Owner</th>
                    <th className="px-6 py-3 text-right">FPTS</th>
                  </tr>
                </thead>
                <tbody>
                  {league.teams.map((team, i) => (
                    <tr
                      key={team.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectLeagueTeam(team)}
                    >
                      <td className="px-6 py-4 font-medium">#{i + 1}</td>
                      <td className="px-6 py-4">{team.name}</td>
                      <td className="px-6 py-4">{team.userName}</td>
                      <td className="px-6 py-4 text-right">{team.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Modal
              isOpen={!!selectedLeagueTeam}
              onClose={() => {
                setSelectedLeagueTeam(null);
                setSelectedTeamPlayers([]);
              }}
            >
              {selectedLeagueTeam && (
                <>
                  <h2 className="text-2xl font-bold mb-4">{selectedLeagueTeam.name}'s Players</h2>
                  <table className="min-w-full text-sm text-left text-gray-800 border border-black">
                    <thead className="bg-gray-200 text-gray-900">
                      <tr>
                        <th className="px-6 py-3 border-b border-black">Player</th>
                        <th className="px-6 py-3 border-b border-black">Position</th>
                        <th className="px-6 py-3 border-b border-black">
                          {isBudgetLeague ? "Price" : "NBA Team"}
                        </th>
                        <th className="px-6 py-3 border-b border-black">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTeamPlayers.map((player) => (
                        <tr
                          key={player.id}
                          className="hover:bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedLeaguePlayer(player)}
                        >
                          <td className="px-6 py-4 border-b border-black">{player.firstName} {player.lastName}</td>
                          <td className="px-6 py-4 border-b border-black">{player.position}</td>
                          <td className="px-6 py-4 border-b border-black">
                            {isBudgetLeague
                              ? `$${player.price?.toFixed(1) ?? "N/A"}`
                              : player.team}
                          </td>
                          <td className="px-6 py-4 border-b border-black">{player.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedLeaguePlayer && (
                    <PlayerCard
                      player={selectedLeaguePlayer}
                      onClose={() => setSelectedLeaguePlayer(null)}
                    />
                  )}
                </>
              )}
            </Modal>
          </>
        )}

        {activeTab === "Stats" && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800">League Player Stats</h2>
            <div className="overflow-auto rounded-lg border border-slate-300">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-left">
                      {isBudgetLeague ? "Value" : "Team"}
                    </th>
                    {[
                      ["fantasyPoints", "FPTS"],
                      ["points", "PTS"],
                      ["rebounds", "REB"],
                      ["assists", "AST"],
                      ["steals", "STL"],
                      ["blocks", "BLK"],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-center cursor-pointer"
                        onClick={() =>
                          setSortBy(key) || setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                        }
                      >
                        {label} {sortBy === key && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(isBudgetLeague
                    ? leaguePlayers.filter((p) => myTeams.some((t) => t.leagueId === parseInt(leagueId) && t.name === p.fantasyTeamName))
                    : leaguePlayers
                  )
                    .sort((a, b) => {
                      const valA = sortBy === "fg"
                        ? a.averages.fieldGoalPercentage
                        : sortBy === "ft"
                          ? a.averages.freeThrowPercentage
                          : a.averages[sortBy];
                      const valB = sortBy === "fg"
                        ? b.averages.fieldGoalPercentage
                        : sortBy === "ft"
                          ? b.averages.freeThrowPercentage
                          : b.averages[sortBy];
                      return sortDirection === "asc" ? valA - valB : valB - valA;
                    })
                    .slice((leagueStatsPage - 1) * playersPerPage, leagueStatsPage * playersPerPage)
                    .map((p) => (
                      <tr key={p.id} onClick={() => setSelectedLeaguePlayer(p)} className="cursor-pointer hover:bg-gray-100 border-t">
                        <td className="px-4 py-2">{p.firstName} {p.lastName}</td>
                        <td className="px-4 py-2">
                          {isBudgetLeague ? `$${p.price?.toFixed(1) ?? "N/A"}` : p.fantasyTeamName}
                        </td>
                        <td className="px-4 py-2 text-center">{p.averages.fantasyPoints.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">{p.averages.points.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">{p.averages.rebounds.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">{p.averages.assists.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">{p.averages.steals.toFixed(1)}</td>
                        <td className="px-4 py-2 text-center">{p.averages.blocks.toFixed(1)}</td>
                      </tr>
                    ))}

                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
              {getPaginationNumbers(leagueStatsPage, Math.ceil(leaguePlayers.length / playersPerPage)).map(
                (item, index) =>
                  item === "..." ? (
                    <span key={`ellipsis-stats-${index}`} className="px-3 py-1 text-gray-500 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-stats-${item}`}
                      onClick={() => setLeagueStatsPage(item)}
                      className={`px-4 py-1 rounded border font-medium ${leagueStatsPage === item
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-800 hover:bg-violet-100"
                        }`}
                    >
                      {item}
                    </button>
                  )
              )}
            </div>

            {selectedLeaguePlayer && (
              <PlayerCard
                player={selectedLeaguePlayer}
                onClose={() => setSelectedLeaguePlayer(null)}
              />
            )}
          </>
        )}
        {activeTab === "Free agents" && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800">Free Agents</h2>
            <div className="flex justify-start mb-4">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm w-full max-w-xs"
              />
            </div>
            <div className="overflow-auto rounded-lg border border-slate-300">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    {isBudgetLeague && <th className="px-4 py-3 text-center">Value</th>}
                    {[
                      ["fantasyPoints", "FPTS"],
                      ["points", "PTS"],
                      ["rebounds", "REB"],
                      ["assists", "AST"],
                      ["steals", "STL"],
                      ["blocks", "BLK"],
                    ].map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-center cursor-pointer"
                        onClick={() =>
                          setSortBy(key) || setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                        }
                      >
                        {label} {sortBy === key && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentAgents.map((p) => (
                    <tr
                      key={p.id}
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        setSelectedFreeAgent(p);
                      }}
                      className="cursor-pointer hover:bg-gray-100 border-t"
                    >
                      <td className="px-4 py-2 flex items-center gap-2">
                        <button
                          className="rounded-full w-6 h-6 flex items-center justify-center text-xs bg-green-500 hover:bg-green-600 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayerToAdd(p);
                            setSwapModalOpen(true);
                          }}
                        >
                          +
                        </button>
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="px-4 py-2">{p.team}</td>
                      {isBudgetLeague && (
                        <td className="px-4 py-2 text-center">${p.price?.toFixed(1) ?? "N/A"}</td>
                      )}
                      <td className="px-4 py-2 text-center">{p.averages.fantasyPoints.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center">{p.averages.points.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center">{p.averages.rebounds.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center">{p.averages.assists.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center">{p.averages.steals.toFixed(1)}</td>
                      <td className="px-4 py-2 text-center">{p.averages.blocks.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {swapModalOpen && playerToAdd && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 relative">

                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                    onClick={() => {
                      setSwapModalOpen(false);
                      setPlayerToAdd(null);
                      setPlayerToRemoveId(null);
                    }}
                  >
                    &times;
                  </button>
                  <h2 className="text-xl font-bold mb-4 text-center">Add Free Agent</h2>

                  <div className="text-center mb-2 font-semibold text-gray-700">
                    Adding: {playerToAdd.firstName} {playerToAdd.lastName}
                  </div>

                  <div className="border rounded p-4 space-y-2 max-h-64 overflow-y-auto">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setPlayerToRemoveId(p.id)}
                        className={`p-2 rounded cursor-pointer flex justify-between items-center ${playerToRemoveId === p.id ? 'bg-violet-100' : 'hover:bg-gray-100'}`}
                      >
                        <div>{p.firstName} {p.lastName} ({p.position})</div>
                        {playerToRemoveId === p.id && (
                          <span className="text-violet-600 font-bold">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      if (!playerToRemoveId) {
                        alert("Please select a player to swap out.");
                        return;
                      }
                      
                      const outgoingPlayer = players.find(p => p.id === playerToRemoveId);
                      if (!outgoingPlayer) {
                        alert("Could not find the selected player to remove.");
                        return;
                      }
                      
                      if (outgoingPlayer.position !== playerToAdd.position) {
                        alert("You can only swap players with the same position.");
                        return;
                      }
                      
                      try {
                        const res = await fetch(`https://localhost:7119/api/team/take-free-agent`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                          },
                          body: JSON.stringify({
                            teamId: selectedTeam,
                            playerOutId: playerToRemoveId,
                            playerInId: playerToAdd.id,
                          }),
                        });

                        if (!res.ok) throw new Error(await res.text());

                        alert("Player swapped successfully!");
                        window.location.reload();
                      } catch (err) {
                        console.error("Failed to swap players:", err.message);
                        alert(err.message);
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded mt-4 font-bold"
                  >
                    Confirm Swap
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
              {getPaginationNumbers(freeAgentPage, Math.ceil(filteredFreeAgents.length / playersPerPage)).map(
                (item, index) =>
                  item === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500 select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      onClick={() => setFreeAgentPage(item)}
                      className={`px-4 py-1 rounded border font-medium ${freeAgentPage === item
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-800 hover:bg-violet-100"
                        }`}
                    >
                      {item}
                    </button>
                  )
              )}
            </div>
            {selectedFreeAgent && (
              <PlayerCard
                player={selectedFreeAgent}
                onClose={() => setSelectedFreeAgent(null)}
              />
            )}
          </>
        )}
        {activeTab === "Trades" && selectedTeam && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Trades</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold"
              >
                Make Trade
              </button>
            </div>
            <Trades teamId={selectedTeam} showModal={showModal} setShowModal={setShowModal} leagueId={leagueId} />
          </>
        )}
        {activeTab === "Forum" && <ForumPosts leagueId={leagueId} />}
      </div>
      {showBoostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
              onClick={() => setShowBoostModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-center">Boost Your Team</h2>
            <p className="text-gray-600 text-sm text-center">
              Spend coins to add fantasy points to your team.
              <br />
              Conversion rate: <strong>10 coins = 20 points</strong>
            </p>
            <input
              type="number"
              min={10}
              step={10}
              value={coinsToSpend}
              onChange={(e) => setCoinsToSpend(Number(e.target.value))}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800 bg-white"
              placeholder="Enter coins to spend"
            />

            <button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-bold"
              onClick={async () => {
                if (coinsToSpend < 10) {
                  alert("Minimum boost is 10 coins");
                  return;
                }

                try {
                  const res = await fetch("https://localhost:7119/api/team/boost", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                      teamId: selectedTeam,
                      coinsToSpend: coinsToSpend
                    })
                  });

                  if (!res.ok) {
                    const errorText = await res.text();
                    alert(errorText);
                  }

                  const data = await res.json();
                  alert(data.message);
                  setShowBoostModal(false);
                  window.location.reload();
                } catch (err) {
                  alert(err.message);
                }
              }}
            >
              Confirm Boost
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default LeagueTeamsPage;
