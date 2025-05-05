import { useEffect, useState } from "react";
import Modal from "react-modal";
import { jwtDecode } from "jwt-decode";

Modal.setAppElement("#root");

function LeaguesPage() {
    const [leagues, setLeagues] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [guardLimit, setGuardLimit] = useState(5);
    const [forwardLimit, setForwardLimit] = useState(5);
    const [centerLimit, setCenterLimit] = useState(2);
    const [limitPreset, setLimitPreset] = useState("5-5-2");
    const [leagueTeams, setLeagueTeams] = useState({});

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchLeagues();
    }, []);

    useEffect(() => {
        switch (limitPreset) {
            case "5-5-2":
                setGuardLimit(5);
                setForwardLimit(5);
                setCenterLimit(2);
                break;
            case "4-4-4":
                setGuardLimit(4);
                setForwardLimit(4);
                setCenterLimit(4);
                break;
            case "6-4-2":
                setGuardLimit(6);
                setForwardLimit(4);
                setCenterLimit(2);
                break;
            case "4-6-2":
                setGuardLimit(4);
                setForwardLimit(6);
                setCenterLimit(2);
                break;
            case "none":
                setGuardLimit(99);
                setForwardLimit(99);
                setCenterLimit(99);
                break;
            default:
                break;
        }
    }, [limitPreset]);
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = jwtDecode(token);
            const id = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
            setCurrentUserId(id);
        }
    }, []);
    const fetchLeagues = async () => {
        try {
            const res = await fetch("https://localhost:7119/api/league/all");
            if (!res.ok) throw new Error("Failed to fetch leagues");
            const data = await res.json();
            const filtered = data.filter((l) => l.id !== 9999);
            setLeagues(filtered);

            for (const league of filtered) {
                fetchTeamsForLeague(league.id);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchTeamsForLeague = async (leagueId) => {
        try {
            const res = await fetch(`https://localhost:7119/api/league/${leagueId}/teams`);
            if (!res.ok) throw new Error("Failed to fetch teams");
            const data = await res.json();
            const teamNames = data.teams?.map((t) => t.name) || [];
            setLeagueTeams((prev) => ({ ...prev, [leagueId]: teamNames }));
        } catch (err) {
            console.error(`Error loading teams for league ${leagueId}:`, err);
        }
    };
    const handleDeleteLeague = async (leagueId) => {
        if (!window.confirm("Are you sure you want to delete this league?")) return;

        try {
            const res = await fetch(`https://localhost:7119/api/league/${leagueId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!res.ok) throw new Error(await res.text());

            alert("League deleted successfully.");
            fetchLeagues(); // Refresh leagues
        } catch (err) {
            alert("Failed to delete league: " + err.message);
        }
    };

    const handleCreateLeague = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("You must be logged in.");
            const decoded = jwtDecode(token);

            const commissionerId = parseInt(
                decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
            );

            const res = await fetch("https://localhost:7119/api/league/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    password,
                    description: "",
                    draftDateTime: new Date().toISOString(),
                    visibility: "public",
                    commissionerId,
                    guardLimit,
                    forwardLimit,
                    centerLimit,
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const result = await res.json();
            setSuccess(`League "${result.name}" created.`);
            setModalOpen(false);
            fetchLeagues();
            setName("");
            setPassword("");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Leagues</h1>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold"
                >
                    ➕ Create League
                </button>
            </div>

            {error && <p className="text-red-400 mb-4">{error}</p>}
            {success && <p className="text-green-400 mb-4">{success}</p>}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.length === 0 ? (
                    <p className="text-gray-300 text-center">No leagues found.</p>
                ) : (
                    leagues
                        .filter((league) => league.id !== 9999)
                        .map((league) => (
                            <div key={league.id} className="bg-slate-800 p-5 rounded-xl shadow-md hover:shadow-lg transition">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-xl font-semibold text-white">{league.name}</h3>
                                    {league.commissioner?.id === currentUserId && (
                                        <button
                                            onClick={() => handleDeleteLeague(league.id)}
                                            title="Delete League"
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                <p className="text-sm text-gray-400">Created by: {league.commissioner?.username || "Unknown"}</p>
                                <p className="text-xs text-gray-400 mt-1">Drafted: {league.drafted ? "Yes" : "No"}</p>
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-white">Teams:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-300">
                                        {leagueTeams[league.id]?.length ? (
                                            leagueTeams[league.id].map((teamName, i) => (
                                                <li key={i}>{teamName}</li>
                                            ))
                                        ) : (
                                            <li className="italic text-gray-500">No teams</li>
                                        )}
                                    </ul>
                                </div>

                            </div>
                        ))

                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                className="relative bg-slate-800 text-white p-6 rounded-lg max-w-md w-full mx-auto mt-24 shadow-xl outline-none"
                overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
            >
                <button
                    onClick={() => setModalOpen(false)}
                    className="absolute top-3 right-4 text-gray-300 hover:text-white text-2xl font-bold"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2 className="text-xl font-semibold mb-4">Create a New League</h2>

                <form onSubmit={handleCreateLeague} className="space-y-4">
                    <input
                        type="text"
                        placeholder="League Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                    />

                    <input
                        type="text"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                    />

                    <div>
                        <label className="block text-sm mb-1">Position Limit Preset</label>
                        <select
                            value={limitPreset}
                            onChange={(e) => setLimitPreset(e.target.value)}
                            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                        >
                            <option value="5-5-2">5 Guards, 5 Forwards, 2 Centers</option>
                            <option value="4-4-4">4 Guards, 4 Forwards, 4 Centers</option>
                            <option value="6-4-2">6 Guards, 4 Forwards, 2 Centers</option>
                            <option value="4-6-2">4 Guards, 6 Forwards, 2 Centers</option>
                            <option value="none">No Limitations</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {limitPreset === "custom" && (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Guards"
                                value={guardLimit}
                                onChange={(e) => setGuardLimit(+e.target.value)}
                                className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                placeholder="Forwards"
                                value={forwardLimit}
                                onChange={(e) => setForwardLimit(+e.target.value)}
                                className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                            />
                            <input
                                type="number"
                                placeholder="Centers"
                                value={centerLimit}
                                onChange={(e) => setCenterLimit(+e.target.value)}
                                className="w-full px-4 py-2 rounded bg-gray-700 text-white"
                            />
                        </div>
                    )}

                    {error && <p className="text-red-500">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold"
                    >
                        Create League
                    </button>
                </form>
            </Modal>

        </div>
    );
}

export default LeaguesPage;
