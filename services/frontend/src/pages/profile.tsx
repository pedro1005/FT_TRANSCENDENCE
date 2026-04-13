import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

interface AchievementsData {
  unlocked: Achievement[];
  locked: Achievement[];
  total: number;
  unlockedCount: number;
}

interface AccountData {
  createdAt: string;
}

interface MatchStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
}

function getLevelProgress(wins: number, losses: number) {
  // Convert to XP: 10 XP per win, 3 XP per loss
  const totalXp = wins * 10 + losses * 3;
  
  let xpThreshold = 30;
  let currentLevelXp = 0;

  // Calculate current level
  while (currentLevelXp + xpThreshold <= totalXp) {
    currentLevelXp += xpThreshold;
    xpThreshold += 10;
  }

  // Calculate progress to next level (0-100%)
  const xpInCurrentLevel = totalXp - currentLevelXp;
  return xpThreshold > 0 ? (xpInCurrentLevel / xpThreshold) * 100 : 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const levelProgress = stats ? getLevelProgress(stats.wins, stats.losses) : 0;

  const circleSize = 160;
  const strokeWidth = 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (levelProgress / 100) * circumference;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      try {
        const [accountRes, statsRes] = await Promise.all([
          axios.get<AccountData>("/api/users/me"),
          axios.get<MatchStats>("/api/matches/me/stats"),
        ]);

        setAccount(accountRes.data);
        setStats(statsRes.data);
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          console.error("Failed to load profile data:", error);
        }
      }
    };

    loadProfileData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadAchievements = async () => {
      try {
        const res = await axios.get(`/api/achievements/user/${user.id}`);

        setAchievements(res.data);
      } catch (error: unknown) {
        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          console.error("Failed to load achievements:", error);
        }
      }
    };

    loadAchievements();
  }, [user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-6 h-56 bg-[radial-gradient(circle_at_top,_rgba(0,210,255,0.20),_transparent_72%)]" />

      <div className="relative space-y-8">
        <section className="overflow-hidden rounded-3xl border-2 border-[var(--tron-blue)] bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,210,255,0.22)]">
          <div className="grid gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg
                  className="h-full w-full -rotate-90"
                  viewBox={`0 0 ${circleSize} ${circleSize}`}
                  aria-hidden="true"
                >
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#ff1aff"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/80">
                  <span className="text-base uppercase tracking-[0.35em] text-gray-400">Level</span>
                  <span className="text-7xl font-bold text-[var(--tron-blue)]">{stats?.level ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-base uppercase tracking-[0.35em] text-[var(--tron-blue)]">Player Profile</p>
                <h1 className="mt-3 text-5xl font-bold text-white">{user.username}</h1>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-[var(--tron-blue)]/50 bg-black/60 p-5 shadow-[0_0_16px_rgba(0,210,255,0.12)]">
                  <p className="text-base uppercase tracking-wide text-gray-400">Username</p>
                  <p className="mt-3 text-2xl font-bold text-white">{user.username}</p>
                </div>

                <div className="rounded-2xl border border-[var(--tron-orange)]/50 bg-black/60 p-5 shadow-[0_0_16px_rgba(255,157,0,0.12)]">
                  <p className="text-base uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-3 break-all text-2xl font-bold text-white">{user.email}</p>
                </div>

                <div className="rounded-2xl border border-green-500/50 bg-black/60 p-5 shadow-[0_0_16px_rgba(0,255,0,0.12)]">
                  <p className="text-base uppercase tracking-wide text-gray-400">Account created</p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {account ? formatDate(account.createdAt) : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {achievements && (
          <section className="w-full">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-3xl font-bold glow-text" style={{ color: "var(--tron-blue)" }}>
                ACHIEVEMENTS
              </h2>
              <span className="text-lg text-gray-300">
                {achievements.unlockedCount} / {achievements.total} unlocked
              </span>
            </div>

            <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--tron-blue)] transition-all duration-500"
                style={{ width: `${(achievements.unlockedCount / achievements.total) * 100}%` }}
              />
            </div>

            {achievements.unlocked.length > 0 && (
              <div className="mb-8">
                <p className="mb-4 text-lg uppercase tracking-wide text-green-400">Unlocked</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {achievements.unlocked.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-5 rounded-2xl border border-green-500/40 bg-black/60 p-5 shadow-[0_0_16px_rgba(0,255,0,0.08)]"
                    >
                      <span className="text-4xl">{achievement.icon}</span>
                      <div>
                        <p className="text-xl font-bold text-white">{achievement.name}</p>
                        <p className="mt-1 text-base text-gray-300">{achievement.description}</p>
                        {achievement.unlockedAt && (
                          <p className="mt-2 text-base text-green-400">
                            Unlocked on {formatDate(achievement.unlockedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.locked.length > 0 && (
              <div>
                <p className="mb-4 text-lg uppercase tracking-wide text-gray-400">Locked</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {achievements.locked.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-5 rounded-2xl border border-white/10 bg-black/40 p-5 opacity-60"
                    >
                      <span className="text-4xl grayscale">🔒</span>
                      <div>
                        <p className="text-xl font-bold text-gray-300">{achievement.name}</p>
                        <p className="mt-1 text-base text-gray-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
