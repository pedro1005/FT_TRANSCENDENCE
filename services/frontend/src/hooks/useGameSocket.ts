// services/frontend/src/hooks/useGameSocket.ts
import { useEffect, useState, useContext, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { AuthContext } from "@/context/AuthContext";

interface GameState {
	ball: {
		position: { x: number; y: number };
		radius: number;
	};
	leftPaddle: {
		position: { x: number; y: number };
		width: number;
		height: number;
	};
	rightPaddle: {
		position: { x: number; y: number };
		width: number;
		height: number;
	};
	score: {
		left: number;
		right: number;
	};
	leftUsername?: string;
	rightUsername?: string;
	tick: number;
}

interface GameOverData {
	winner?: "left" | "right";
	winnerUsername?: string;
	score?: { left: number; right: number };
	message?: string;
	matchId?: string;
	mode?: string;
	unlockedAchievements?: AchievementNotification[];
}

interface PlayerLabels {
	left: string;
	right: string;
}

export interface AchievementNotification {
	id: string;
	key: string;
	name: string;
	description: string;
	icon: string;
}

export type GameMode = "pvp" | "ai" | "local";
export type AIDifficulty = "easy" | "normal" | "hard";

type LatencyPongPayload = {
	sentAt?: number;
	serverAt?: number;
};

export function useGameSocket() {
	const { isAuthenticated } = useContext(AuthContext);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [status, setStatus] = useState<
		"disconnected" | "waiting" | "playing" | "paused" | "finished"
	>("disconnected");
	const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
	const [currentMode, setCurrentMode] = useState<"pvp" | "ai" | null>(null);
	const [playerSide, setPlayerSide] = useState<"left" | "right" | null>(null);
	const [playerLabels, setPlayerLabels] = useState<PlayerLabels | null>(null);
	const [reconnectionCountdown, setReconnectionCountdown] = useState<number>(0);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [latencyMs, setLatencyMs] = useState<number | null>(null);
	const currentModeRef = useRef<"pvp" | "ai" | null>(null);
	const latencySamplesRef = useRef<number[]>([]);
	const latencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	
	// For continuous input sending
	const currentInputRef = useRef<"up" | "down" | "stop">("stop");
	const inputSendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!isAuthenticated) return;

		// Connect through nginx gateway (same origin as frontend)
		// Nginx proxies /socket.io to backend with WebSocket upgrade headers
		const socketUrl = window.location.origin; // e.g., https://localhost

		const newSocket = io(socketUrl, {
			withCredentials: true,
			transports: ["websocket"],
			// Force path to /socket.io (default, but explicit is better)
			path: "/socket.io",
		});

		newSocket.on("connect", () => {
			setConnectionError(null);
			setStatus("disconnected");
			startLatencyMonitoring(newSocket);

			// Auto-reconnect to game if we were disconnected
			setTimeout(() => {
				newSocket.emit('reconnectToGame');
			}, 100);
		});

		newSocket.on("latencyPong", (payload: LatencyPongPayload) => {
			if (typeof payload?.sentAt !== "number" || !Number.isFinite(payload.sentAt)) {
				return;
			}

			const sample = Date.now() - payload.sentAt;
			if (!Number.isFinite(sample) || sample < 0 || sample > 10000) {
				return;
			}

			const nextSamples = [...latencySamplesRef.current, sample].slice(-10);
			latencySamplesRef.current = nextSamples;

			const average = Math.round(
				nextSamples.reduce((sum, value) => sum + value, 0) / nextSamples.length,
			);
			setLatencyMs(average);
		});

		newSocket.on("connect_error", (error: Error) => {
			console.error("Socket connection error:", error.message);
			if (error.message.includes("Authentication")) {
				setConnectionError("Session expired. Please refresh and log in to play PvP or AI");
			} else {
				setConnectionError("Failed to connect to game server.");
			}
		});

		newSocket.on("waiting", (data: { message: string }) => {
			setStatus("waiting");
		});

		newSocket.on("gameStarted", (data: { gameId: number; message: string; mode?: string; side?: "left" | "right"; leftUsername?: string; rightUsername?: string }) => {
			setStatus("playing");
			setGameOverData(null);
			setPlayerLabels({
				left: data.leftUsername ?? "Left Player",
				right: data.rightUsername ?? (data.mode === "ai" ? "AI" : "Right Player"),
			});
			
			// Track the current game mode
			if (data.mode === 'ai') {
				setCurrentMode('ai');
				currentModeRef.current = 'ai';
				setPlayerSide('left'); // User is always left in AI mode
			} else {
				setCurrentMode('pvp');
				currentModeRef.current = 'pvp';
				setPlayerSide(data.side ?? null);
			}

			// Start continuous input sending
			startInputPolling(newSocket);
		});

		newSocket.on("gameState", (state: GameState) => {
			setGameState(state);
			if (state.leftUsername || state.rightUsername) {
				setPlayerLabels((prev: PlayerLabels | null) => ({
					left: state.leftUsername ?? prev?.left ?? "Left Player",
					right: state.rightUsername ?? prev?.right ?? (currentModeRef.current === "ai" ? "AI" : "Right Player"),
				}));
			}
		});

		newSocket.on("gameOver", (data: GameOverData) => {
			const unlockedAchievements = Array.isArray(data.unlockedAchievements)
				? data.unlockedAchievements.filter((achievement): achievement is AchievementNotification => {
					if (!achievement || typeof achievement !== "object") return false;

					return (
						typeof achievement.id === "string" &&
						typeof achievement.key === "string" &&
						typeof achievement.name === "string" &&
						typeof achievement.description === "string" &&
						typeof achievement.icon === "string"
					);
				})
				: [];

			setStatus("finished");
			setGameOverData({
				...data,
				mode: currentModeRef.current || undefined,
				unlockedAchievements,
			});

			// Stop input polling
			stopInputPolling();
		});

		newSocket.on("matchmakingError", (data: { message: string }) => {
			console.warn("⚠️ Matchmaking error:", data.message);
			setStatus("disconnected");
			setGameOverData({
				message: data.message,
			});
		});

		newSocket.on("opponentDisconnected", (data: { message: string; countdown: number }) => {
			setStatus("paused");
			setReconnectionCountdown(data.countdown);

			// Start countdown timer
			const interval = setInterval(() => {
				setReconnectionCountdown((prev: number) => {
					if (prev <= 1) {
						clearInterval(interval);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		});

		newSocket.on("gameResumed", (data: { message: string; mode?: string; side?: "left" | "right"; leftUsername?: string; rightUsername?: string }) => {
			if (data.leftUsername || data.rightUsername) {
				setPlayerLabels((prev: PlayerLabels | null) => ({
					left: data.leftUsername ?? prev?.left ?? "Left Player",
					right: data.rightUsername ?? prev?.right ?? "Right Player",
				}));
			}
			if (data.mode === 'pvp') {
				setCurrentMode('pvp');
				currentModeRef.current = 'pvp';
				setPlayerSide(data.side ?? null);
			}
			setStatus("playing");
			setReconnectionCountdown(0);
			// Resume input polling on reconnect
			startInputPolling(newSocket);
		});

		newSocket.on("matchmakingCancelled", (data: { message: string }) => {
			setStatus("disconnected");
			setCurrentMode(null);
			currentModeRef.current = null;
		});

		newSocket.on("disconnect", () => {
			setStatus("disconnected");
			stopInputPolling();
			stopLatencyMonitoring();
		});

		setSocket(newSocket);

		return () => {
			stopInputPolling();
			stopLatencyMonitoring();
			newSocket.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]); // Only reconnect when auth changes, not game state

	const startInputPolling = (sock: Socket) => {
		if (inputSendIntervalRef.current) {
			clearInterval(inputSendIntervalRef.current);
		}

		// Send current input state every 33ms (30 Hz)
		// This is a balance between smoothness and bandwidth
		inputSendIntervalRef.current = setInterval(() => {
			if (sock && sock.connected) {
				sock.emit("playerMove", { direction: currentInputRef.current });
			}
		}, 33);
	};

	const stopInputPolling = () => {
		if (inputSendIntervalRef.current) {
			clearInterval(inputSendIntervalRef.current);
			inputSendIntervalRef.current = null;
		}
		currentInputRef.current = "stop";
	};

	const startLatencyMonitoring = (sock: Socket) => {
		if (latencyIntervalRef.current) {
			clearInterval(latencyIntervalRef.current);
		}

		latencyIntervalRef.current = setInterval(() => {
			if (sock.connected) {
				sock.emit("latencyPing", { sentAt: Date.now() });
			}
		}, 1000);

		if (sock.connected) {
			sock.emit("latencyPing", { sentAt: Date.now() });
		}
	};

	const stopLatencyMonitoring = () => {
		if (latencyIntervalRef.current) {
			clearInterval(latencyIntervalRef.current);
			latencyIntervalRef.current = null;
		}
		latencySamplesRef.current = [];
		setLatencyMs(null);
	};

	const joinGame = () => {
		if (!isAuthenticated) {
			setConnectionError("You must be logged in to play PvP or AI");
			return;
		}

		if (socket) {
			setCurrentMode('pvp');
			currentModeRef.current = 'pvp';
			socket.emit("joinGame");
		}
	};

	const joinAIGame = (difficulty: AIDifficulty = "normal") => {
		if (!isAuthenticated) {
			setConnectionError("You must be logged in to play PvP or AI");
			return;
		}

		if (socket) {
			setCurrentMode('ai');
			currentModeRef.current = 'ai';
			socket.emit("joinAIGame", { difficulty });
		}
	};

	const cancelMatchmaking = () => {
		if (socket && status === "waiting") {
			socket.emit("cancelMatchmaking");
		}
	};

	const sendMove = (direction: "up" | "down" | "stop") => {
		// Update the current input ref
		// The polling interval will pick this up and send it
		currentInputRef.current = direction;
	};

	const resetGameSession = () => {
		stopInputPolling();
		setGameState(null);
		setGameOverData(null);
		setStatus("disconnected");
		setCurrentMode(null);
		currentModeRef.current = null;
		setPlayerSide(null);
		setPlayerLabels(null);
		setReconnectionCountdown(0);
	};

	const networkQuality =
		latencyMs === null ? "unknown" : latencyMs <= 80 ? "good" : latencyMs <= 150 ? "fair" : "poor";

	return {
		socket,
		gameState,
		status,
		gameOverData,
		currentMode,
		playerSide,
		playerLabels,
		reconnectionCountdown,
		connectionError,
		latencyMs,
		networkQuality,
		joinGame,
		joinAIGame,
		cancelMatchmaking,
		resetGameSession,
		sendMove,
	};
}
