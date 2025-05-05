import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [username, setUsername] = useState(storedUser?.username || "");
  const [email] = useState(storedUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState([]);
  const [leagueNames, setLeagueNames] = useState({});

  const initials = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("https://localhost:7119/api/team/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch teams.");
        const data = await res.json();
        setTeams(data);

        const leagueMap = {};
        await Promise.all(
          data.map(async (team) => {
            try {
              const leagueRes = await fetch(`https://localhost:7119/api/league/${team.leagueId}`);
              if (leagueRes.ok) {
                const leagueData = await leagueRes.json();
                leagueMap[team.leagueId] = leagueData.name;
              } else {
                leagueMap[team.leagueId] = "Unknown League";
              }
            } catch {
              leagueMap[team.leagueId] = "Error fetching league";
            }
          })
        );
        setLeagueNames(leagueMap);
      } catch (err) {
        console.error("Error loading teams or leagues:", err);
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match.");
      return;
    }

    const response = await fetch(`https://localhost:7119/api/auth/${storedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: newPassword || "",
        oldPassword,
      }),
    });

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify({ ...storedUser, username }));
      setMessage("✅ Profile updated successfully.");
    } else {
      const error = await response.text();
      setMessage(`${error}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl space-y-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
            <div>
              <p className="text-sm text-gray-500">Welcome, coach</p>
              <h1 className="text-2xl font-semibold text-gray-800">{username}</h1>
              <p className="text-sm text-gray-600">{email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Sign out
          </button>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Managed Teams</h2>
          {teams.length === 0 ? (
            <div className="bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-sm text-gray-600">
              You don’t have any teams yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="bg-gray-100 border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-800"
                >
                  🏀 {team.name}{" "}
                  <span className="text-gray-500">
                    ({leagueNames[team.leagueId] || "Loading league..."})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-700">Update Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm pr-10 focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.03-10-9s4.477-9 10-9 10 4.03 10 9c0 1.146-.25 2.244-.7 3.243M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 3l18 18M9.88 9.88a3 3 0 104.24 4.24M10.73 5.1A9.96 9.96 0 0112 5c5.523 0 10 4.03 10 9 0 1.149-.251 2.251-.7 3.251m-2.054 2.054A9.963 9.963 0 0112 19c-5.523 0-10-4.03-10-9 0-1.149.251-2.251.7-3.251" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold text-lg"
          >
            Save Changes
          </button>

          {message && (
            <p className="text-sm mt-2 text-center text-gray-600">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
