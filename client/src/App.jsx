import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import StatsPage from "./pages/StatsPage";
import TeamsPage from "./pages/TeamsPage";
import LeaguesPage from "./pages/LeaguesPage";
import DraftMode from "./pages/TeamBuilder/DraftMode";
import LeagueTeamsPage from "./pages/LeagueTeamsPage";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";
import BudgetMode from "./pages/TeamBuilder/BudgetMode";
import GamesPage from "./pages/GamesPage";
import QuestionPage from "./pages/QuestionsPage";

function AppLayout() {
  const location = useLocation();
  const hideSidebar = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar />}
        <main className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-100 to-gray-200">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/login"
              element={
                <RedirectIfAuthenticated>
                  <LoginPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route
              path="/register"
              element={
                <RedirectIfAuthenticated>
                  <RegisterPage />
                </RedirectIfAuthenticated>
              }
            />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/leagues" element={<LeaguesPage />} />
            <Route path="/team/draft" element={<DraftMode />} />
            <Route path="/team/budget" element={<BudgetMode />} />
            <Route path="/league/:leagueId/teams" element={<LeagueTeamsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/questions" element={<QuestionPage/>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
