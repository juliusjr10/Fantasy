import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

function DraftRoom({ leagueId, teams }) {
  const connectionRef = useRef(null);
  const [draftStarted, setDraftStarted] = useState(false);
  const [draftCountdown, setDraftCountdown] = useState(10);
  const [currentPick, setCurrentPick] = useState(0);
  const [pickTimer, setPickTimer] = useState(60);
  const [playersPicked, setPlayersPicked] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [isPicking, setIsPicking] = useState(false);
  const [connected, setConnected] = useState(false);
  const [draftEnded, setDraftEnded] = useState(false);
  const [teamRosters, setTeamRosters] = useState({});
  const [draftHistory, setDraftHistory] = useState([]);
  const [searchPlayerTerm, setSearchPlayerTerm] = useState("");
  const [positionLimits, setPositionLimits] = useState({ G: 5, F: 5, C: 2 });

  const user = JSON.parse(localStorage.getItem("user"));

  const getPickTeamIndex = (pick) => {
    const round = Math.floor(pick / teams.length);
    const indexInRound = pick % teams.length;
    return round % 2 === 0 ? indexInRound : teams.length - 1 - indexInRound;
  };
  const getUserTeamRoster = () => {
    return playersPicked
      .filter((p) => p.teamId === currentTeam?.id)
      .map((p) => allPlayers.find((pl) => pl.id === p.playerId))
      .filter(Boolean);
  };

  const countPositions = (roster) => {
    return roster.reduce((counts, player) => {
      counts[player.position] = (counts[player.position] || 0) + 1;
      return counts;
    }, {});
  };

  const realPickIndex = getPickTeamIndex(currentPick);
  const currentTeam = teams[realPickIndex];
  const isUserTurn = currentTeam?.userId === user?.id;

  const fetchDraftHistory = async () => {
    try {
      const res = await fetch(`https://localhost:7119/api/league/${leagueId}/draft-picks`);
      const data = await res.json();
      setDraftHistory(data);
    } catch (err) {
      console.error("Error fetching draft history:", err);
    }
  };

  const fetchTeamRosters = async () => {
    try {
      const res = await fetch(`https://localhost:7119/api/league/${leagueId}/draft-picks`);
      if (!res.ok) throw new Error(await res.text());
      const picks = await res.json();

      const rosters = {};
      for (const pick of picks) {
        if (!rosters[pick.teamId]) {
          rosters[pick.teamId] = [];
        }
        rosters[pick.teamId].push({
          id: pick.playerId,
          firstName: pick.playerFirstName,
          lastName: pick.playerLastName,
          position: pick.playerPosition,
          team: pick.playerTeam,
        });
      }

      setTeamRosters(rosters);
      setDraftHistory(picks);
    } catch (err) {
      console.error("Failed to load draft rosters:", err);
    }
  };

  const fetchLeagueDetails = async () => {
    try {
      const res = await fetch(`https://localhost:7119/api/league/${leagueId}`);
      if (!res.ok) throw new Error("Failed to fetch league data");

      const data = await res.json();
      setPositionLimits({
        G: data.guardLimit,
        F: data.forwardLimit,
        C: data.centerLimit
      });
    } catch (err) {
      console.error("Failed to load league settings:", err);
    }
  };

  const checkDraftStatus = async () => {
    try {
      await fetchLeagueDetails();

      const res = await fetch(`https://localhost:7119/api/league/${leagueId}`);
      const data = await res.json();

      if (data.drafted) {
        setDraftEnded(true);
        setDraftStarted(false);
        await fetchDraftHistory();
        await fetchTeamRosters();
      } else {
        connectSignalR();
      }
    } catch (err) {
      console.error("Error checking draft status:", err);
    }
  };


  const connectSignalR = async () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7119/drafthub", {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connection.on("DraftStarted", () => {
      setDraftStarted(true);
      setDraftCountdown(0);
    });

    connection.on("DraftEnded", async () => {
      setDraftStarted(false);
      setDraftEnded(true);
      await fetchTeamRosters();
      await fetchDraftHistory();
    });

    connection.on("PlayerPicked", (pick) => {
      setPlayersPicked((prev) =>
        prev.some(p => p.playerId === pick.playerId) ? prev : [...prev, pick]
      );
      setCurrentPick(pick.pickNumber);
      setPickTimer(60);
    });

    connection.on("SyncDraft", (state) => {
      setDraftStarted(state.draftStarted);
      setPlayersPicked(state.picks);
      setCurrentPick(state.picks.length);
      setPickTimer(state.timeLeft ?? 60);
    });

    connection.onreconnected(async () => {
      await connection.invoke("JoinLeague", leagueId);
      await connection.invoke("SyncDraft", leagueId);
    });

    await connection.start();
    await connection.invoke("JoinLeague", leagueId);
    await connection.invoke("SyncDraft", leagueId);
    connectionRef.current = connection;
    setConnected(true);
  };

  const handlePickPlayer = useCallback((playerId) => {
    const player = allPlayers.find(p => p.id === playerId);
    const teamRoster = getUserTeamRoster();
    const positionCount = countPositions(teamRoster);
    const limit = positionLimits[player.position] || Infinity;

    if ((positionCount[player.position] || 0) >= limit) {
      alert(`You cannot pick more than ${limit} players at ${player.position}`);
      return;
    }

    const confirmMsg = `Are you sure you want to pick ${player.firstName} ${player.lastName}?`;
    if (!window.confirm(confirmMsg)) return;

    if (
      isPicking ||
      !connectionRef.current ||
      connectionRef.current.state !== signalR.HubConnectionState.Connected
    ) return;

    const pick = {
      teamId: currentTeam.id,
      playerId,
      pickNumber: currentPick + 1,
    };

    setIsPicking(true);

    connectionRef.current
      .invoke("MakePick", leagueId, pick, false)
      .catch((err) => console.error("MakePick failed:", err))
      .finally(() => setIsPicking(false));
  }, [currentPick, currentTeam, leagueId, isPicking, allPlayers]);


  const handleAutoPick = useCallback(() => {
    console.log("AutoPick triggered");

    if (!currentTeam) {
      console.warn("No current team to autopick for.");
      return;
    }

    const teamRoster = playersPicked
      .filter((p) => p.teamId === currentTeam.id)
      .map((p) => allPlayers.find((pl) => pl.id === p.playerId))
      .filter(Boolean);

    const positionCount = countPositions(teamRoster);

    const available = allPlayers.filter((player) => {
      const alreadyPicked = playersPicked.some((pick) => pick.playerId === player.id);
      const currentCount = positionCount[player.position] || 0;
      const limit = positionLimits[player.position] || Infinity;
      return !alreadyPicked && currentCount < limit;
    });

    if (available.length > 0) {
      const random = available[Math.floor(Math.random() * available.length)];
      console.log("Auto-picking:", random);
      handlePickPlayer(random.id);
    } else {
      console.log("No valid players left to autopick.");
    }
  }, [allPlayers, playersPicked, currentTeam, handlePickPlayer]);





  useEffect(() => {
    checkDraftStatus();
  }, [leagueId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const res = await fetch("https://localhost:7119/api/players");
      const data = await res.json();
      setAllPlayers(data);
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (draftStarted && !draftEnded && pickTimer === 0 && isUserTurn) {
      handleAutoPick();
    }
  }, [pickTimer, draftStarted, draftEnded, isUserTurn, handleAutoPick]);

  useEffect(() => {
    if (!draftStarted || draftEnded) return;

    const interval = setInterval(() => {
      setPickTimer(prev => {
        if (prev === 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPick, draftStarted, draftEnded]);


  useEffect(() => {
    return () => {
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke("LeaveLeague", leagueId).catch(console.warn);
        connectionRef.current.stop().catch(console.warn);
      }
    };
  }, [leagueId]);

  const availablePlayers = allPlayers.filter(
    (p) => {
      const notPicked = !playersPicked.some((pick) => pick.playerId === p.id);
      const nameMatch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPlayerTerm.toLowerCase());
      return notPicked && nameMatch;
    }
  );


  return (
    <div className="space-y-8 text-gray-800">
      {draftEnded && (
        <div className="bg-green-100 text-green-800 text-xl font-semibold p-4 rounded-xl shadow border border-green-300 text-center">
          Draft Complete! All teams are finalized.
        </div>
      )}

      {!connected && !draftEnded ? (
        <div className="text-center">
          <p className="text-xl font-semibold">Connect to start draft</p>
        </div>
      ) : !draftStarted && !draftEnded ? (
        <div className="text-center">
          <button
            onClick={() => connectionRef.current?.invoke("StartDraft", leagueId)}
            className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700"
          >
            Start Draft
          </button>
        </div>
      ) : (
        <>
          {!draftEnded && (
            <div className="flex justify-between items-center">
              <p className="text-xl"><strong>Current Pick:</strong> {currentTeam?.name}</p>
              <p className="text-xl font-semibold text-orange-600">⏱ {pickTimer}s</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map((team) => {
              const teamRoster = draftEnded
                ? teamRosters[team.id] || []
                : playersPicked
                  .filter((p) => p.teamId === team.id)
                  .map((p) => allPlayers.find((pl) => pl.id === p.playerId))
                  .filter(Boolean);

              return (
                <div key={team.id} className="bg-gray-100 rounded-lg p-4 border">
                  <h3 className="font-bold text-lg mb-2">{team.name}'s Roster</h3>

                  {!Object.values(positionLimits).includes(99) && (
                    <div className="flex space-x-4 mb-2 text-sm font-medium text-gray-700">
                      {Object.entries(positionLimits).map(([pos, limit]) => {
                        const counts = countPositions(teamRoster);
                        const count = counts[pos] || 0;
                        return (
                          <div key={pos}>
                            {pos} {count}/{limit}
                          </div>
                        );
                      })}
                    </div>
                  )}


                  <ul className="text-sm space-y-1">
                    {teamRoster.map((player, i) => (
                      <li key={i}>
                        {i + 1}. {player.firstName} {player.lastName} ({player.position})
                      </li>
                    ))}
                    {teamRoster.length === 0 && <li className="text-gray-500">No players yet.</li>}
                  </ul>
                </div>
              );
            })}
          </div>


          <div className="bg-white p-4 border rounded-xl">
            <h2 className="font-bold text-lg mb-2">📜 Draft History</h2>
            <ul className="max-h-64 overflow-y-auto space-y-1 text-sm text-gray-700">
              {(draftEnded ? draftHistory : playersPicked).map((pick, i) => {
                const player = allPlayers.find((p) => p.id === pick.playerId);
                const team = teams.find((t) => t.id === pick.teamId);
                return (
                  <li key={i}>
                    #{pick.pickNumber}: {team?.name} ➞ {player?.firstName} {player?.lastName} ({player?.position})
                  </li>
                );
              })}
              {(draftEnded ? draftHistory : playersPicked).length === 0 && (
                <li className="text-gray-500">No picks yet.</li>
              )}
            </ul>
          </div>
          {!draftEnded && (
            <div className="mb-4">
              <input
                type="text"
                value={searchPlayerTerm}
                onChange={(e) => setSearchPlayerTerm(e.target.value)}
                placeholder="Search players by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {!draftEnded && (
            <div className="overflow-auto rounded-lg border border-slate-700 shadow">
              <table className="min-w-full bg-white text-gray-900 shadow-sm rounded-md">
                <thead className="bg-gray-100 text-sm border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Player</th>
                    <th className="px-4 py-3 text-left font-semibold">Team</th>
                    <th className="px-4 py-3 text-left font-semibold">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {availablePlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer"
                      onClick={() => handlePickPlayer(player.id)}
                    >
                      <td className="px-4 py-3 font-medium">{player.firstName} {player.lastName}</td>
                      <td className="px-4 py-3">
                        <img
                          src={`/logos/${player.team.toLowerCase().replace(/\s+/g, "_")}.png`}
                          alt={player.team}
                          className="w-6 h-6 object-contain inline-block mr-2 align-middle"
                        />
                        <span className="align-middle">{player.team}</span>
                      </td>
                      <td className="px-4 py-3">{player.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DraftRoom;
