import { useEffect, useState } from "react";

function CreateQuestionForm({ onSuccess }) {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({
    gameId: "",
    playerId: "",
    category: "Points",
    threshold: "",
    deadline: new Date(),
  });

  const categories = ["Points", "Assists", "Rebounds", "Steals", "Blocks"];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch("https://localhost:7119/api/game/calculated-games");
        if (!res.ok) throw new Error("Failed to fetch calculated games");

        const calculatedGames = await res.json();
        const lastDate = calculatedGames.length
          ? new Date(calculatedGames[0].date)
          : new Date();

        const nextDayUtc = new Date(Date.UTC(
          lastDate.getUTCFullYear(),
          lastDate.getUTCMonth(),
          lastDate.getUTCDate() + 1
        ));

        const startDateParam = nextDayUtc.toISOString();

        const upcomingRes = await fetch(
          `https://localhost:7119/api/game/games/by-date?startDate=${startDateParam}`
        );
        if (!upcomingRes.ok) throw new Error("No upcoming games found");

        const upcomingGames = await upcomingRes.json();
        setGames(
          upcomingGames.map((g) => ({
            id: g.Id ?? g.id,
            date: g.Date ?? g.date,
            homeTeam: g.HomeTeam ?? g.homeTeam,
            awayTeam: g.AwayTeam ?? g.awayTeam,
          }))
        );
        
        
      } catch (err) {
        console.error("Error loading games:", err);
        alert("Could not load games.");
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!form.gameId) return;

      try {
        const res = await fetch(`https://localhost:7119/api/game/${form.gameId}/data`);
        if (!res.ok) throw new Error("Failed to fetch game players");
        const data = await res.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlayers();
  }, [form.gameId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "gameId") {
      const selected = games.find(g => g.id === parseInt(value));
      const gameDate = new Date(selected.date);
      const deadline = new Date(gameDate.getTime() - 30 * 60 * 1000); // -30 mins

      setForm(prev => ({
        ...prev,
        [name]: value,
        deadline,
        playerId: ""
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const payload = {
      gameId: parseInt(form.gameId),
      playerId: parseInt(form.playerId),
      category: form.category,
      threshold: parseFloat(form.threshold),
      deadline: form.deadline.toISOString(),
    };

    try {
      const res = await fetch("https://localhost:7119/api/question/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Question created!");
        onSuccess?.();
      } else {
        const error = await res.text();
        alert("Failed: " + error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create question.");
    }
  };

  return (
    <div className="bg-slate-900 text-white max-w-3xl mx-auto p-6 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold mb-6">Create New Player Question</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 font-medium">Game</label>
          <select
            name="gameId"
            value={form.gameId}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.homeTeam} vs {g.awayTeam} ({new Date(g.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {form.gameId && (
          <div>
            <label className="block mb-2 font-medium">Player</label>
            <select
              name="playerId"
              value={form.playerId}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={p.playerId} value={p.playerId}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block mb-2 font-medium">Stat Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Threshold</label>
          <input
            name="threshold"
            type="number"
            value={form.threshold}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-semibold transition"
        >
          Submit
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default CreateQuestionForm;
