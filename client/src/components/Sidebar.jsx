import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  QuestionMarkCircleIcon,
  FlagIcon
} from "@heroicons/react/outline";

const navItems = [
  { label: "Home", path: "/", icon: <HomeIcon className="h-5 w-5" /> },
  { label: "Teams", path: "/teams", icon: <UserGroupIcon className="h-5 w-5" /> },
  { label: "Leagues", path: "/leagues", icon: <FlagIcon className="h-5 w-5" /> },
  { label: "Stats", path: "/stats", icon: <ChartBarIcon className="h-5 w-5" /> },
  { label: "Games", path: "/games", icon: <CalendarIcon className="h-5 w-5" /> },
  { label: "Questions", path: "/questions", icon: <QuestionMarkCircleIcon className="h-5 w-5" /> },
  { label: "Rules", path: "/rules", icon: <ClipboardListIcon className="h-5 w-5" /> },
];


function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <aside
      className={`h-screen sticky top-0 bg-[#0F1B33] text-white flex flex-col transition-all duration-300 ${isCollapsed ? "w-[70px]" : "w-60"
        }`}
    >
      <div className="flex justify-end px-4 py-4 border-b border-white/10">
        <button
          onClick={toggleCollapse}
          className="text-white hover:text-blue-500 transition"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start"
                } gap-3 px-4 h-12 rounded-lg transition-all font-medium ${isActive
                  ? "bg-blue-600 text-white"
                  : "text-white hover:bg-blue-500/20"
                }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">{item.icon}</div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
