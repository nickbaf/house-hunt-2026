import { Link, useLocation } from "react-router-dom";
import { Home, GitCompareArrows, MapPin, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { username, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/compare", label: "Compare", icon: GitCompareArrows },
    { to: "/map", label: "Map", icon: MapPin },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-xl">🏠</span>
            <span className="text-lg font-bold text-zinc-100">
              House Hunt <span className="text-emerald-400">2026</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  location.pathname === to
                    ? "bg-zinc-800 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300">
            <User className="h-4 w-4 text-emerald-400" />
            {username}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
