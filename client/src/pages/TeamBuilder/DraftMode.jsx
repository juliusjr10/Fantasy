import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import EyeIcon from "../../icons/EyeIcon";
import EyeCloseIcon from "../../icons/EyeCloseIcon";

// ... imports remain the same

function DraftMode() {
  const [teams, setTeams] = useState([]);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [leaguePassword, setLeaguePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUserTeams = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("https://localhost:7119/api/team/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUserTeams();
  }, []);

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`https://localhost:7119/api/team/${teamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Team deleted successfully.");
      fetchUserTeams();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleJoinLeague = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://localhost:7119/api/league/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          leagueName,
          password: leaguePassword,
          teamName,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      navigate(`/league/${data.leagueId}/teams`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">📝 Draft Mode</h1>

      {teams.length > 0 && !showJoinForm ? (
        <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Teams</h2>
          <ul className="space-y-2">
            {teams
              .filter((t) => t.leagueId !== 9999)
              .map((team) => (
                <li key={team.id} className="bg-gray-700 px-4 py-2 rounded flex justify-between items-center">
                  <span>{team.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/league/${team.leagueId}/teams`)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="text-sm text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
          <button
            onClick={() => setShowJoinForm(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold mt-4"
          >
            ➕ Join Another League
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleJoinLeague}
          className="w-full max-w-md space-y-4 bg-gray-800 p-6 rounded-xl shadow-md"
        >
          <h2 className="text-xl mb-2">Join League</h2>

          <div>
            <label className="block mb-1">League Name</label>
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded"
            />
          </div>

          <div>
            <label className="block mb-1">League Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={leaguePassword}
                onChange={(e) => setLeaguePassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded pr-10"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5 text-gray-300" />
                ) : (
                  <EyeCloseIcon className="w-5 h-5 text-gray-300" />
                )}
              </span>
            </div>
          </div>

          <div>
            <label className="block mb-1">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded"
            />
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex gap-4">
            <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold">
              Join League
            </button>
            {teams.length > 0 && (
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

export default DraftMode;

