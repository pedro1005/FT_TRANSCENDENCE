// src/pages/index.tsx
import { FC, useState } from "react";
import styles from "@/styles/card.module.css";
import Modal from "@/components/Modal";

interface Developer {
  id: string;
  initials: string;
  name: string;
  badge: string;
  badgeColor: "blue" | "orange" | "green" | "purple" | "pink";
  strengths: string;
  color: "blue" | "orange" | "green" | "purple" | "pink";
}

const developers: Developer[] = [
  { id: "pedmonte", initials: "PM", name: "pedmonte", badge: "Frontend", badgeColor: "blue", strengths: "Next.js, TypeScript, \nCSS", color: "blue" },
  { id: "gamado-x", initials: "GX", name: "gamado-x", badge: "Security", badgeColor: "orange", strengths: "WAF, Vault, \nJWT", color: "orange" },
  { id: "antfonse", initials: "AF", name: "antfonse", badge: "Gaming", badgeColor: "green", strengths: "Physics, Game Engine, AI", color: "green" },
  { id: "madao-da", initials: "MD", name: "madao-da", badge: "Backend", badgeColor: "purple", strengths: "NestJS, TypeScript, Socket.io", color: "purple" },
  { id: "pauldos-", initials: "PD", name: "pauldos-", badge: "Data", badgeColor: "pink", strengths: "Prisma,\nPostgreSql", color: "pink" },
];

const colorMap: Record<Developer["color"], string> = {
  blue: "border-[#00d2ff]",
  orange: "border-[#ff8c00]",
  green: "border-[#00ff85]",
  purple: "border-[#c200ff]",
  pink: "border-[#ff4ec8]",
};

const badgeMap: Record<Developer["badgeColor"], string> = {
  blue: "bg-[#00d2ff]",
  orange: "bg-[#ff8c00]",
  green: "bg-[#00ff85]",
  purple: "bg-[#c200ff]",
  pink: "bg-[#ff4ec8]",
};

// Developer card component
const DeveloperCard: FC<{ dev: Developer; index: number; onContact: (dev: Developer) => void }> = ({ dev, index, onContact }) => (
  <div
    className={`${styles.card} ${colorMap[dev.color]} group ${styles.cardEnter}`}
    style={{
      animationDelay: `${index * 0.1}s`,
    }}
  >
    <div className={styles.cardPhoto}>
      <span>{dev.initials}</span>
    </div>
    <h3>{dev.name}</h3>
    <span className={`${badgeMap[dev.badgeColor]} ${styles[dev.badgeColor]}`}>{dev.badge}</span>
    <p className="whitespace-pre-line">{dev.strengths}</p>
    <button onClick={() => onContact(dev)}>Contact</button>
  </div>
);

export default function Home() {
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContact = async (dev: Developer) => {
    setSelectedDev(dev);
    setLoading(true);
    setError(null);
    setUserInfo(null);
    
    try {
      const response = await fetch(`/api/forty-two/user/${dev.name}`);
      if (!response.ok) {
        throw new Error("Failed to fetch developer info");
      }
      const data = await response.json();
      setUserInfo(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDev(null);
    setUserInfo(null);
    setError(null);
  };

  return (
    <div className="relative flex flex-col items-center pt-20">

      {/* Neon Title */}
      <div className="relative mb-10 select-none pointer-events-none text-center">

        {/* Outer glow layer */}
        <h2 className="absolute inset-0 text-5xl font-black tracking-widest font-mono neon-glow">
          Developed by
        </h2>

      {/* Main neon tube */}
      <h2 className="text-5xl font-black tracking-widest font-mono neon-text">
        Developed by
      </h2>

      </div>
      {/* Grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-6xl w-full px-4 justify-items-center">
        {developers.map((dev, i) => (
          <div key={dev.id}>
            <DeveloperCard dev={dev} index={i} onContact={handleContact} />
          </div>
        ))}
      </div>

        <Modal 
  isOpen={selectedDev !== null} 
  onClose={closeModal} 
  title={`Developer: ${selectedDev?.name}`}
>
  {loading && (
    <div className="flex flex-col items-center py-4">
      <div className="w-10 h-10 border-4 border-[#00d2ff] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[#00d2ff] font-mono animate-pulse">
        Accessing Intra 42...
      </p>
    </div>
  )}

  {error && (
    <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400">
      <p className="font-bold mb-1">Error</p>
      <p>{error}</p>
    </div>
  )}

  {userInfo && (
    <div className="space-y-5">

      <div className="flex items-center space-x-4">
        {userInfo.image?.link && (
          <img
            src={userInfo.image.link}
            alt={userInfo.login}
            className="w-20 h-20 rounded-full border-2 border-[#00d2ff] shadow-[0_0_10px_rgba(0,210,255,0.5)]"
          />
        )}

        <div>
          <p className="text-xl font-bold text-white">
            {userInfo.displayname}
          </p>
          <p className="text-[#00d2ff] font-mono">
            {userInfo.login}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-500 uppercase mb-1">
            Level
          </p>
          <p className="text-lg font-bold text-[#ff8c00]">
            {userInfo.cursus_users?.[0]?.level ?? "N/A"}
          </p>
        </div>

        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-500 uppercase mb-1">
            Projects
          </p>
          <p className="text-lg font-bold text-[#00ff85]">
            {userInfo.projects_users?.filter(
              (p: any) => p.status === "finished"
            )?.length ?? 0}
          </p>
        </div>

      </div>

      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-xs text-gray-500 uppercase mb-2">
          Email
        </p>
        <p className="text-white break-all">
          {userInfo.email}
        </p>
      </div>

      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-xs text-gray-500 uppercase mb-2">
          Campus
        </p>
        <p className="text-white">
          {userInfo.campus?.[0]?.name || "N/A"}
        </p>
      </div>

      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
        <p className="text-xs text-gray-500 uppercase tracking-tighter mb-3">
          Project List
        </p>

        <div className="max-h-25 overflow-y-auto space-y-2 pr-2">
          {userInfo.projects_users
            ?.filter((p: any) => p.status === "finished")
            ?.sort((a: any, b: any) => (b.final_mark ?? 0) - (a.final_mark ?? 0))
            //?.slice(0, 3)
            ?.map((p: any, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm border-b border-white/10 pb-1"
              >
                <span className="text-white">
                  {p.project?.name}
                </span>

                <span className="text-[#00ff85] font-mono">
                  {p.final_mark ?? "N/A"}
                </span>
              </div>
            ))}
        </div>
      </div>

    </div>
  )}
</Modal>

      <style jsx>{`
     

        /* Real Neon Text */
      .neon-text {
      color: #ffffff;
      position: relative;
      text-shadow:
        0 0 4px #fff,
        0 0 10px #00d2ff,
        0 0 20px #00d2ff,
        0 0 40px #00d2ff,
        0 0 80px #00d2ff;
        animation: neon-flicker 3s infinite alternate;
      }

      /* Big outer bloom */
      .neon-glow {
      color: #00d2ff;
      filter: blur(25px);
      opacity: 0.6;
      }

      /* Neon flicker (realistic) */
      @keyframes neon-flicker {
        0%, 18%, 22%, 25%, 53%, 57%, 100% {
        text-shadow:
        0 0 4px #fff,
        0 0 10px #00d2ff,
        0 0 20px #00d2ff,
        0 0 40px #00d2ff,
        0 0 80px #00d2ff;
      }

      20%, 24%, 55% {
        text-shadow:
        0 0 2px #fff,
        0 0 6px #00d2ff,
        0 0 12px #00d2ff;
      }
    }
      `}</style>
    </div>
  );
}