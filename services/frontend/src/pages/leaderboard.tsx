import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  achievementsCount?: number; // <-- Adicionado para bater certo com o backend
}

export default function Leaderboard() {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  const router = useRouter();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = user?.id;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    axios
      .get("/api/achievements/leaderboard")
      .then((res) => setLeaders(res.data))
      .catch((error) => {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          console.error("Failed to load leaderboard:", error);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const rankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-gray-500";
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return "👑";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto pt-20 px-4 pb-16">
      <h1 className="text-4xl font-bold text-center mb-8 glow-text" style={{ color: "var(--tron-blue)" }}>
        LEADERBOARD
      </h1>

      {loading ? (
        <div className="text-center text-white py-16">
          <div className="w-16 h-16 border-4 border-[var(--tron-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((entry) => (
            <div
              key={entry.id}
              className={`p-5 bg-black/60 border-2 rounded-xl backdrop-blur-md transition-all duration-300 flex items-center gap-6 ${
                entry.id === currentUserId
                  ? "border-[var(--tron-blue)] shadow-[0_0_20px_rgba(0,210,255,0.3)]"
                  : "border-white/10 hover:border-[var(--tron-blue)]/50"
              }`}
            >
              {/* Rank */}
              <div className={`text-2xl font-bold min-w-[48px] text-center ${rankStyle(entry.rank)}`}>
                {rankIcon(entry.rank)}
              </div>

              {/* Username */}
              <div className="flex-grow">
                <p className={`text-lg font-bold ${entry.id === currentUserId ? "text-[var(--tron-blue)]" : "text-white"}`}>
                  {entry.username}
                  {entry.id === currentUserId && <span className="text-xs ml-2 text-gray-400">(you)</span>}
                </p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>{entry.total} matches played</span>
                  {entry.achievementsCount !== undefined && (
                    <span className="text-[var(--tron-blue)]">🏆 {entry.achievementsCount} medals</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Wins</p>
                  <p className="text-xl font-bold text-green-500">{entry.wins}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Losses</p>
                  <p className="text-xl font-bold text-red-500">{entry.losses}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Win Rate</p>
                  <p className="text-xl font-bold text-[var(--tron-orange)]">{entry.winRate}%</p>
                </div>
              </div>
            </div>
          ))}

          {leaders.length === 0 && (
            <div className="text-center text-white p-16 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl">
              <p className="text-xl">No players yet. Be the first!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
