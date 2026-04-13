// src/components/Layout.tsx
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useRouter } from "next/router";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const isGamePage = router.asPath.startsWith("/game");

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden">
      
      {/* Global Background Layer */}
      <div className="fixed inset-0 bg-black -z-50"></div>

      {/* Neon Pong + Throne Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

        {/* Tron Grid Background */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00d2ff 1px, transparent 1px),
              linear-gradient(to bottom, #00d2ff 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(circle at center, black, transparent 90%)"
          }}
        ></div>

        {!isGamePage && (
          <>
            {/* Left Paddle */}
            <div className="absolute left-12 w-3 h-24 bg-[#00d2ff] shadow-[0_0_15px_#00d2ff] animate-paddle-left -translate-y-1/2"></div>

            {/* Right Paddle */}
            <div className="absolute right-12 w-3 h-24 bg-[#ff4ec8] shadow-[0_0_15px_#ff4ec8] animate-paddle-right -translate-y-1/2"></div>

            {/* Pong Ball */}
            <div className="absolute w-4 h-4 bg-white shadow-[0_0_20px_#fff] animate-pong-ball -translate-y-1/2"></div>
          </>
        )}

        {/* Base radial halo */}
        <div className="absolute inset-0 bg-gradient-radial from-[#00d2ff]/10 via-[#ff4ec8]/5 to-[#ff8c00]/0"></div>

        {/* Vertical pong-style rays */}
        <div className="absolute inset-0 flex justify-between px-16">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-full bg-gradient-to-b from-[#00d2ff]/20 via-[#ff4ec8]/10 to-[#ff8c00]/20 blur-xl animate-pong"
              style={{ animationDelay: `${i * 0.5}s` }}
            ></div>
          ))}
        </div>

        {/* Throne halo behind the grid */}
        <div className="absolute w-[900px] h-[600px] rounded-full bg-gradient-to-t from-[#00d2ff]/30 via-[#ff4ec8]/20 to-[#ff8c00]/10 blur-3xl top-1/4 left-1/2 -translate-x-1/2 animate-pulse-slow"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Keyframes */}
      <style jsx>{`
        @keyframes paddle-left {
          0%, 100% { top: 20%; }
          25% { top: 50%; }
          50% { top: 75%; }
          75% { top: 40%; }
        }
        @keyframes paddle-right {
          0%, 100% { top: 50%; }
          25% { top: 80%; }
          50% { top: 40%; }
          75% { top: 30%; }
        }
        @keyframes pong-ball {
          0% {
            left: calc(3rem + 1rem);
            top: 20%;
          }
          25% {
            left: calc(100% - 3rem - 1rem);
            top: 80%;
          }
          50% {
            left: calc(3rem + 1rem);
            top: 75%;
          }
          75% {
            left: calc(100% - 3rem - 1rem);
            top: 30%;
          }
          100% {
            left: calc(3rem + 1rem);
            top: 20%;
          }
        }
        .animate-paddle-left {
          animation: paddle-left 8s ease-in-out infinite;
        }
        .animate-paddle-right {
          animation: paddle-right 8s ease-in-out infinite;
        }
        .animate-pong-ball {
          animation: pong-ball 8s linear infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 10s ease-in-out infinite;
        }
        @keyframes atmospheric {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-pong {
          animation: atmospheric 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}