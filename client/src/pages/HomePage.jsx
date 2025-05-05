import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
    }
  }, [navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 sm:p-10 border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome{user ? `, ${user.username}` : ""} 👋
        </h1>
        <p className="text-gray-600 mb-6">
          You are now logged in. Let’s build your fantasy league.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
