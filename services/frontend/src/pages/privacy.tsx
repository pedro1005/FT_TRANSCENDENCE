// src/pages/privacy.tsx
import { FC } from "react";

const Privacy: FC = () => {
  return (
    <div className="relative flex flex-col items-center pt-20 max-w-4xl mx-auto px-4">
      {/* Neon Title */}
      <div className="relative mb-10 select-none pointer-events-none text-center">
        <h2 className="absolute inset-0 text-5xl font-black tracking-widest font-mono neon-glow">
          Privacy Policy
        </h2>
        <h2 className="text-5xl font-black tracking-widest font-mono neon-text">
          Privacy Policy
        </h2>
      </div>

      {/* Content Box */}
      <div className="bg-black/40 border border-[var(--tron-blue)] p-8 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(0,210,255,0.2)] text-gray-300 space-y-6">
        
        <section>
          <h3 className="text-[var(--tron-blue)] text-xl font-bold mb-4">1. Data Collection</h3>
          <p>
            We collect only the data necessary for the operation of <strong>ft_transcendence</strong>, including your 42 school login, display name, and game statistics.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-blue)] text-xl font-bold mb-4">2. Use of Data</h3>
          <p>
            Your data is used to maintain your user profile, track your match history, and manage your ranking on the global leaderboard.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-blue)] text-xl font-bold mb-4">3. Data Security</h3>
          <p>
            We implement reasonable security measures to protect your information. Authentication is handled securely via 42 OAuth and JWT tokens.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-blue)] text-xl font-bold mb-4">4. Cookies</h3>
          <p>
            We use essential cookies only to maintain your session and authentication state. No tracking cookies are used for analytics or advertising.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-blue)] text-xl font-bold mb-4">5. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. Continued use of <strong>ft_transcendence</strong> constitutes acceptance of any changes.
          </p>
        </section>
      </div>

      {/* Neon Text Styles */}
      <style jsx>{`
        .neon-text {
          color: #ffffff;
          position: relative;
          text-shadow:
            0 0 4px #fff,
            0 0 10px #00d2ff,
            0 0 20px #00d2ff;
          animation: neon-flicker 3s infinite alternate;
        }

        .neon-glow {
          color: #00d2ff;
          filter: blur(25px);
          opacity: 0.6;
        }

        @keyframes neon-flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            text-shadow:
              0 0 4px #fff,
              0 0 10px #00d2ff,
              0 0 20px #00d2ff;
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
};

export default Privacy;