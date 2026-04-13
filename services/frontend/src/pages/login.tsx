"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { AuthContext } from "@/context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");  
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const router = useRouter();


  useEffect(() => {
   if (router.query.error) {
    setError(router.query.error as string);
   }
  }, [router.query]);

  const validateForm = (): boolean => {
    const email = formData.email.trim();

    if (!email) {
      setError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
	  const payload = {
		email: formData.email.trim(),
		password: formData.password,
	  };

      await axios.post("/api/auth/login", payload, {
	headers: { "Content-Type": "application/json" },
      });

      await login();
      // Redirect to homepage
      router.push("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid credentials");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-20">
      <div className="w-full max-w-md p-8 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(0,210,255,0.2)]">
        <h2
          className="text-3xl font-bold text-center mb-8 glow-text"
          style={{ color: "var(--tron-blue)" }}
        >
          USER LOGIN
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              EMAIL
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-[var(--tron-blue)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--tron-blue)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-[var(--tron-blue)] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--tron-blue)] transition-all"
            />
          </div>

          {error && (
		<p className="text-red-500 text-sm mt-2">{error}</p>
	  )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-4 bg-[var(--tron-blue)] text-black font-bold rounded-lg hover:bg-white transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.4)] disabled:opacity-50"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>


	<div className="mt-6 text-center">
          <span className="text-white text-sm">or</span>
        </div>

        
        <a href="/api/auth/42"
          className="w-full py-3 px-4 mt-4 flex items-center justify-center bg-black border-2 border-[var(--tron-blue)] text-white font-bold rounded-lg hover:bg-[var(--tron-blue)] hover:text-black transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.4)]"
	>
          LOGIN WITH 42
        </a>


	<p className="text-center text-sm text-white mt-4">
	  Don&apos;t have an account?{" "}
	  <a href="/register" className="text-[var(--tron-blue)] hover:underline">
	    Register here
	  </a>
	</p>
      </div>
    </div>
  );
}
