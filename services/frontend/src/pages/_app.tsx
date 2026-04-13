import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { AuthProvider, AuthContext } from "@/context/AuthContext";
import { useEffect, useContext, useRef } from "react";
import { useRouter } from "next/router";
import axios, { AxiosResponse } from "axios";

axios.defaults.baseURL = typeof window !== "undefined" ? window.location.origin : "https://localhost";
axios.defaults.withCredentials = true;

function AxiosAuthBridge() {
  const router = useRouter();
  const { logout } = useContext(AuthContext);
  // This ref acts like a lock to avoid handling multiple 401 errors at once. No multiple logouts/redirects
  const handlingUnauthorizedRef = useRef(false);

  useEffect(() => {
    // Register one global response interceptor for the whole app.
    // Goal: centralize auth-failure handling (401 Unauthorized).
    const interceptorId = axios.interceptors.response.use(
      // Success path: return response untouched.
      (response: AxiosResponse) => response,
      (error: unknown) => {
        const axiosError = error as {
          config?: { url?: string };
          response?: { status?: number };
        };

        // If this is not an AxiosError OR not a 401, do not interfere.
        // Let each caller handle its own non-auth error as usual.
        if (!axios.isAxiosError(error) || axiosError.response?.status !== 401) {
          return Promise.reject(error);
        }

        // Inspect request URL to skip auth endpoints themselves.
        // We do not want login/register calls to trigger forced logout logic.
        const requestUrl = axiosError.config?.url ?? "";
        const isAuthRequest = requestUrl.includes("/api/auth/");
        const isSessionBootstrapRequest = requestUrl.includes("/api/users/me");

        // Skip if:
        // 1) this was an auth request
        // 2. this was the initial session bootstrap check
        // 2) we are already processing another 401 in parallel
        if (isAuthRequest || isSessionBootstrapRequest || handlingUnauthorizedRef.current) {
          return Promise.reject(error);
        }

        // Acquire lock before starting global unauthorized flow.
        handlingUnauthorizedRef.current = true;

        // Clear local auth state and session context.
        void logout();

        // Redirect to login if we are not already there.
        // The finally block releases the lock even if navigation fails.
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          void router.push("/login").finally(() => {
            handlingUnauthorizedRef.current = false;
          });
        } else {
          // Already on login page: just release lock.
          handlingUnauthorizedRef.current = false;
        }

        // Preserve Promise contract: caller still receives rejected promise.
        // This keeps request-level behavior predictable for consumers.
        return Promise.reject(error);
      },
    );

    return () => {
      // Cleanup is crucial in Next.js dev/hot-reload to avoid duplicate interceptors.
      // If not ejected, the same 401 could be handled multiple times.
      axios.interceptors.response.eject(interceptorId);
    };
  }, [logout, router]);

  // Bridge component has no UI; it exists only for side effects.
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AxiosAuthBridge />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
