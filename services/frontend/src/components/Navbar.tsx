import Link from "next/link";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!mounted) return null;

  return (
    <header className="fixed w-full z-50 border-b border-[var(--tron-blue)] bg-black/80 backdrop-blur-sm shadow-lg">
      <nav className="bg-black/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="text-2xl font-bold glow-text"
                style={{
                  color: "var(--tron-blue)",
                  textShadow: "0 0 10px var(--tron-blue), 0 0 20px var(--tron-blue)",
                }}
              >
                FT_TRANSCENDENCE
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
              >
                Terms
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/game"
                    className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
                  >
                    Play Pong
                  </Link>
                  <Link
                    href="/matches"
                    className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
                  >
                    Match History
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/profile"
                    className="text-white hover:text-[var(--tron-blue)] transition-colors duration-300 text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={toggleMenu} className="text-[var(--tron-blue)] hover:text-white p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`md:hidden transition-all duration-300 overflow-hidden ${
              isOpen ? "max-h-96 py-4" : "max-h-0 py-0"
            } border-t border-[var(--tron-blue)]/30`}
          >
            <Link
              href="/privacy"
              className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
            >
              Terms
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/game"
                  className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
                >
                  Play Pong
                </Link>
                <Link
                  href="/matches"
                  className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
                >
                  Match History
                </Link>
                <Link
                  href="/leaderboard"
                  className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-white hover:text-[var(--tron-blue)] transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 rounded-lg border-2 border-[var(--tron-blue)] text-[var(--tron-blue)] hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 font-medium text-sm glow-button"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
