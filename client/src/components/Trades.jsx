import { useEffect, useState } from "react";

function Trades({ teamId, showModal, setShowModal, leagueId }) {
    const [trades, setTrades] = useState([]);
    const [teams, setTeams] = useState({});
    const [players, setPlayers] = useState({});
    const [loading, setLoading] = useState(true);
    const [myTeamPlayers, setMyTeamPlayers] = useState([]);
    const [receivingTeamId, setReceivingTeamId] = useState("");
    const [offeringPlayerIds, setOfferingPlayerIds] = useState([]);
    const [requestedPlayerIds, setRequestedPlayerIds] = useState([]);
    const [receivingTeamPlayers, setReceivingTeamPlayers] = useState([]);

    const fetchPlayerById = async (id) => {
        try {
            const res = await fetch(`https://localhost:7119/api/players/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const player = await res.json();
            return player;
        } catch (err) {
            console.error(`Failed to fetch player with ID ${id}:`, err.message);
            return null;
        }
    };

    useEffect(() => {
        const fetchTradesAndTeams = async () => {
            try {
                const [tradesRes, teamsRes] = await Promise.all([
                    fetch(`https://localhost:7119/api/trade/team/${teamId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }),
                    fetch(`https://localhost:7119/api/league/${leagueId}/teams`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    })
                ]);

                if (!tradesRes.ok) throw new Error(await tradesRes.text());
                if (!teamsRes.ok) throw new Error(await teamsRes.text());

                const tradesData = await tradesRes.json();
                const leagueTeams = await teamsRes.json();

                setTrades(tradesData);

                const teamsMap = {};
                leagueTeams.teams.forEach(team => {
                    teamsMap[team.id] = team.name;
                });

                setTeams(teamsMap);

                const myPlayersRes = await fetch(`https://localhost:7119/api/team/${teamId}/players`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });

                if (!myPlayersRes.ok) throw new Error(await myPlayersRes.text());
                const myPlayers = await myPlayersRes.json();
                setMyTeamPlayers(myPlayers);
                const playersMap = {};
                myPlayers.forEach(player => {
                    playersMap[player.id] = `${player.firstName} ${player.lastName}`;
                });
                setPlayers(playersMap);


            } catch (err) {
                console.error("Failed to fetch trades or teams:", err.message);
            } finally {
                setLoading(false);
            }
        };

        if (teamId && leagueId) fetchTradesAndTeams();
    }, [teamId, leagueId]);

    useEffect(() => {
        const fetchMyPlayers = async () => {
            if (!teamId || !showModal) return;
            try {
                const myPlayersRes = await fetch(`https://localhost:7119/api/team/${teamId}/players`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                if (!myPlayersRes.ok) throw new Error(await myPlayersRes.text());
                const myPlayers = await myPlayersRes.json();

                const playersMap = {};
                myPlayers.forEach(player => {
                    playersMap[player.id] = `${player.firstName} ${player.lastName}`;
                });

                setPlayers(playersMap);
            } catch (err) {
                console.error("Failed to fetch updated players:", err.message);
            }
        };

        fetchMyPlayers();
    }, [showModal, teamId]);


    const cancelTrade = async (tradeId) => {
        if (!window.confirm("Are you sure you want to cancel this trade?")) return;
        try {
            const res = await fetch(`https://localhost:7119/api/trade/${tradeId}/cancel`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const updatedTrades = trades.map(trade =>
                trade.id === tradeId ? { ...trade, status: "Canceled" } : trade
            );
            setTrades(updatedTrades);
            alert("Trade canceled successfully.");
        } catch (err) {
            console.error("Failed to cancel trade:", err.message);
            alert("Failed to cancel trade.");
        }
    };

    const submitTrade = async () => {
        try {
            const res = await fetch("https://localhost:7119/api/trade", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    offeringTeamId: teamId,
                    offeringPlayerIds,
                    receivingTeamId: parseInt(receivingTeamId),
                    receivingPlayerIds: requestedPlayerIds,
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            alert("Trade proposed successfully.");
            setShowModal(false);
            window.location.reload();
        } catch (err) {
            console.error("Failed to create trade:", err.message);
            alert("Failed to create trade.");
        }
    };
    const isBalancedTrade = (() => {
        if (
          offeringPlayerIds.length !== requestedPlayerIds.length ||
          offeringPlayerIds.length === 0
        ) return false;
      
        const getPositions = (ids, playersList) => {
          return ids
            .map(id => {
              const player = playersList.find(p => p.id === id);
              return player?.position;
            })
            .filter(Boolean)
            .sort();
        };
      
        const offeringPositions = getPositions(offeringPlayerIds, myTeamPlayers);
        const requestedPositions = getPositions(requestedPlayerIds, receivingTeamPlayers);
      
        return JSON.stringify(offeringPositions) === JSON.stringify(requestedPositions);
      })();
      

    const acceptTrade = async (tradeId) => {
        if (!window.confirm("Are you sure you want to accept this trade?")) return;
        try {
            const res = await fetch(`https://localhost:7119/api/trade/${tradeId}/accept`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Trade accepted successfully.");
            window.location.reload();
        } catch (err) {
            console.error("Failed to accept trade:", err.message);
            alert("Failed to accept trade.");
        }
    };


    const declineTrade = async (tradeId) => {
        if (!window.confirm("Are you sure you want to decline this trade?")) return;
        try {
            const res = await fetch(`https://localhost:7119/api/trade/${tradeId}/decline`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Trade declined successfully.");
            window.location.reload();
        } catch (err) {
            console.error("Failed to decline trade:", err.message);
            alert("Failed to decline trade.");
        }
    };

    if (loading) return <div className="text-center text-gray-500">Loading trades...</div>;

    return (
        <div className="relative overflow-auto rounded-lg border border-slate-300">

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                        >
                            &times;
                        </button>

                        <h3 className="text-lg font-bold mb-4">Create Trade</h3>

                        <div>
                            <label className="block mb-1 font-semibold">Receiving Team</label>
                            <select
                                value={receivingTeamId}
                                onChange={async (e) => {
                                    const selectedTeamId = e.target.value;
                                    setReceivingTeamId(selectedTeamId);
                                    setRequestedPlayerIds([]);
                                    if (selectedTeamId) {
                                        try {
                                            const res = await fetch(`https://localhost:7119/api/team/${selectedTeamId}/players`, {
                                                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                                            });
                                            if (!res.ok) throw new Error(await res.text());
                                            const players = await res.json();
                                            setReceivingTeamPlayers(players);
                                        } catch (err) {
                                            console.error("Failed to fetch receiving team players:", err.message);
                                        }
                                    } else {
                                        setReceivingTeamPlayers([]);
                                    }
                                }}
                                className="border px-3 py-2 w-full rounded"
                            >
                                <option value="">Select a team</option>
                                {Object.entries(teams).map(([id, name]) => (
                                    id !== String(teamId) && (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    )
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold">Select Offering Players</label>
                            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                                {myTeamPlayers.map((player) => (
                                    <label key={player.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={offeringPlayerIds.includes(player.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setOfferingPlayerIds([...offeringPlayerIds, player.id]);
                                                } else {
                                                    setOfferingPlayerIds(offeringPlayerIds.filter(pid => pid !== player.id));
                                                }
                                            }}
                                        />
                                        <span>{player.firstName} {player.lastName} ({player.position})</span>
                                    </label>
                                ))}
                            </div>

                        </div>

                        {/* Requested Players Checkboxes */}
                        <div>
                            <label className="block mb-1 font-semibold">Select Requested Players</label>
                            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                                {receivingTeamPlayers.map((player) => (
                                    <label key={player.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={requestedPlayerIds.includes(player.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setRequestedPlayerIds([...requestedPlayerIds, player.id]);
                                                } else {
                                                    setRequestedPlayerIds(requestedPlayerIds.filter(pid => pid !== player.id));
                                                }
                                            }}
                                        />
                                        <span>{player.firstName} {player.lastName} ({player.position})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={submitTrade}
                            disabled={!isBalancedTrade}
                            className={`w-full mt-4 px-6 py-2 rounded-lg font-bold ${isBalancedTrade
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                        >
                            Submit Trade
                        </button>

                    </div>
                </div>
            )}
            <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Offering Team</th>
                        <th className="px-4 py-3 text-left">Receiving Team</th>
                        <th className="px-4 py-3 text-left">Offered Players</th>
                        <th className="px-4 py-3 text-left">Requested Players</th>
                        <th className="px-4 py-3 text-left">Created At</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map((trade) => (
                        <tr key={trade.id} className="border-t hover:bg-gray-50">
                            <td className={`px-4 py-2 font-semibold ${trade.status === "Pending" ? "text-yellow-600" :
                                trade.status === "Accepted" ? "text-green-600" :
                                    "text-red-600"
                                }`}>
                                {trade.status}
                            </td>
                            <td className="px-4 py-2">{teams[trade.offeringTeamId] ?? trade.offeringTeamId}</td>
                            <td className="px-4 py-2">{teams[trade.receivingTeamId] ?? trade.receivingTeamId}</td>
                            <td className="px-4 py-2">
                                {trade.offeringPlayerIds.map((id) => {
                                    if (players[id]) {
                                        return players[id];
                                    } else {
                                        fetchPlayerById(id).then(player => {
                                            if (player) {
                                                setPlayers(prev => ({ ...prev, [id]: `${player.firstName} ${player.lastName}` }));
                                            }
                                        });
                                        return id;
                                    }
                                }).join(", ")}
                            </td>
                            <td className="px-4 py-2">
                                {trade.receivingPlayerIds.map((id) => {
                                    if (players[id]) {
                                        return players[id];
                                    } else {
                                        fetchPlayerById(id).then(player => {
                                            if (player) {
                                                setPlayers(prev => ({ ...prev, [id]: `${player.firstName} ${player.lastName}` }));
                                            }
                                        });
                                        return id;
                                    }
                                }).join(", ")}
                            </td>

                            <td className="px-4 py-2 text-xs text-gray-500">
                                {new Date(trade.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-2">
                                {trade.status === "Pending" && (
                                    <div className="flex flex-col gap-1">
                                        {trade.offeringTeamId === teamId && (
                                            <button
                                                onClick={() => cancelTrade(trade.id)}
                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {trade.receivingTeamId === teamId && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => acceptTrade(trade.id)}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => declineTrade(trade.id)}
                                                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Trades;
