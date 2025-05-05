import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [coins, setCoins] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        setIsLoggedIn(false);
        setUsername("");
        setCoins(0);
        return;
      }

      const parsed = JSON.parse(userData);
      setIsLoggedIn(true);
      setUsername(parsed.username || parsed.email || "User");

      try {
        const res = await fetch(`https://localhost:7119/api/Auth/${parsed.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user data.");
        const user = await res.json();
        setCoins(user.coins || 0);
      } catch (err) {
        console.error("Error fetching user:", err);
        setCoins(0);
      }

      setShowMenu(false);
      setShowMobileMenu(false);
    };

    fetchUser();
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleAuthRedirect = () => {
    if (location.pathname === "/login") {
      navigate("/register");
    } else {
      navigate("/login");
    }
  };

  const getAuthButtonLabel = () => {
    if (location.pathname === "/login") return "Sign Up";
    if (location.pathname === "/register") return "Sign In";
    return "Log In";
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0F1B33] text-white px-6 py-3 flex justify-between items-center shadow-md">
      <Link to="/" className="flex items-center space-x-3">
        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
        <span className="text-xl font-semibold text-white">
          AirBallers Basketball Fantasy
        </span>
      </Link>

      <div className="hidden md:flex items-center space-x-4">
        {isLoggedIn ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 hover:bg-blue-500/20 px-3 py-2 rounded-md transition"
            >
              <span className="text-white font-medium">Hi, {username}</span>
              <span className="text-yellow-400 font-semibold text-sm">🪙 {coins}</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a8.25 8.25 0 1115 0" />
                </svg>
              </div>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#132246] text-white rounded-md shadow-lg border border-white/10 z-50">
                <Link to="/profile" className="block px-4 py-2 hover:bg-blue-500/20">Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-blue-500/20">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleAuthRedirect}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
          >
            {getAuthButtonLabel()}
          </button>
        )}
      </div>

      <div className="md:hidden">
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="focus:outline-none">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {showMobileMenu && (
        <div className="absolute top-16 right-4 w-56 bg-[#132246] text-white rounded-lg shadow-lg border border-white/10 z-50 p-4 md:hidden">
          {isLoggedIn ? (
            <>
              <p className="text-white mb-2">👋 Hi, {username}</p>
              <p className="text-yellow-400 text-sm mb-2">🪙 {coins} Coins</p>
              <Link to="/profile" className="block hover:bg-blue-500/20 px-3 py-2 rounded-md">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-400 hover:bg-blue-500/20 px-3 py-2 rounded-md mt-1"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleAuthRedirect}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
            >
              {getAuthButtonLabel()}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
