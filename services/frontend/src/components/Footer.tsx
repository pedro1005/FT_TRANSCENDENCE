import Link from "next/link";
import { useState } from "react";
import axios from "axios";

export default function Footer() {
  const [message, setMessage] = useState<string>("");

  return (
    <footer className="border-t border-[var(--tron-blue)] bg-black/90 mt-16 py-8 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">

          <span className="text-gray-400 text-sm">
            &copy; 2026 - FT_TRANSCENDENCE
          </span>
      
          <span className="hidden sm:inline text-gray-600">|</span>

          <Link
            href="/privacy"
            className="text-[var(--tron-blue)] hover:text-[var(--tron-orange)] transition-colors duration-300 text-sm font-medium"
          >
            Privacy Policy
          </Link>

          <span className="hidden sm:inline text-gray-600">|</span>

          <Link
            href="/terms"
            className="text-[var(--tron-blue)] hover:text-[var(--tron-orange)] transition-colors duration-300 text-sm font-medium"
          >
            Terms of Service
          </Link>

        </div>
      </div>
    </footer>
  );
}