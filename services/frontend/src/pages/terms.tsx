// src/pages/terms.tsx
import { FC } from "react";

const Terms: FC = () => {
  return (
    <div className="relative flex flex-col items-center pt-20 max-w-4xl mx-auto px-4">
      {/* Neon Title */}
      <div className="relative mb-10 select-none pointer-events-none text-center">
        <h2 className="absolute inset-0 text-5xl font-black tracking-widest font-mono neon-glow">
          Terms of Service
        </h2>
        <h2 className="text-5xl font-black tracking-widest font-mono neon-text">
          Terms of Service
        </h2>
      </div>

      {/* Content Box */}
      <div className="bg-black/40 border border-[var(--tron-orange)] p-8 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(255,140,0,0.2)] text-gray-300 space-y-6">
        
        <section>
          <h3 className="text-[var(--tron-orange)] text-xl font-bold mb-4">1. Acceptance of Terms</h3>
          <p>
            By accessing or using <strong>ft_transcendence</strong>, you agree to comply with these Terms of Service and all applicable rules of fair play. If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-orange)] text-xl font-bold mb-4">2. User Conduct</h3>
          <p className="mb-2">You must not:</p>
          <ul className="list-disc list-inside mt-2 mb-4">
            <li>Use scripts, cheats, bots, or third-party tools to gain an unfair advantage.</li>
            <li>Manipulate game results, statistics, or leaderboards.</li>
            <li>Engage in harassment, hate speech, or abusive behavior toward other users.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-[var(--tron-orange)] text-xl font-bold mb-4">3. Account Responsibility</h3>
          <p>
            You are responsible for all activity performed under your account. Do not share your 42 credentials, JWT tokens, or account access with others. Notify the developers immediately if you suspect unauthorized access to your account.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-orange)] text-xl font-bold mb-4">4. Disclaimers and Limitations</h3>
          <p>
            <strong>ft_transcendence</strong> is a student project provided “as is” without warranties of any kind. The developers are not responsible for service interruptions, data loss, or any damages arising from use of the service. Use at your own risk.
          </p>
        </section>

        <section>
          <h3 className="text-[var(--tron-orange)] text-xl font-bold mb-4">5. Modifications</h3>
          <p>
            The developers may update these Terms at any time. Continued use of <strong>ft_transcendence</strong> constitutes acceptance of the updated Terms.
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
            0 0 10px #ff8c00,
            0 0 20px #ff8c00;
          animation: neon-flicker 3s infinite alternate;
        }

        .neon-glow {
          color: #ff8c00;
          filter: blur(25px);
          opacity: 0.6;
        }

        @keyframes neon-flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            text-shadow:
              0 0 4px #fff,
              0 0 10px #ff8c00,
              0 0 20px #ff8c00;
          }
          20%, 24%, 55% {
            text-shadow:
              0 0 2px #fff,
              0 0 6px #ff8c00,
              0 0 12px #ff8c00;
          }
        }
      `}</style>
    </div>
  );
};

export default Terms;