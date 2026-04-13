import { useEffect, useContext, useState, useRef } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/AuthContext";
import { useGameSocket } from "@/hooks/useGameSocket";
import type { AchievementNotification } from "@/hooks/useGameSocket";
import type { AIDifficulty } from "@/hooks/useGameSocket";
import { useLocalGame } from "@/hooks/useLocalGame";
import GameCanvas from "@/components/GameCanvas";

type GameMode = "pvp" | "ai" | "local";

export default function Game() {
	const { isAuthenticated, isLoading } = useContext(AuthContext);
	const router = useRouter();
	
	// Online game (PvP & AI)
	const { 
		gameState: serverGameState, 
		status: onlineStatus,
		reconnectionCountdown,
		gameOverData,
		playerLabels,
		connectionError,
		latencyMs,
		networkQuality,
		joinGame, 
		joinAIGame,
		cancelMatchmaking,
		resetGameSession,
		sendMove 
	} = useGameSocket();
	
	// Local game
	const {
		gameState: localGameState,
		status: localStatus,
		winner: localWinner,
		startGame: startLocalGame,
		stopGame: stopLocalGame,
	} = useLocalGame();

	const [selectedMode, setSelectedMode] = useState<GameMode>("pvp");
	const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("normal");
	const [localTargetScore, setLocalTargetScore] = useState<3 | 7 | 11>(7);
	const [achievementToasts, setAchievementToasts] = useState<AchievementNotification[]>([]);
	const displayedAchievementKeysRef = useRef<Set<string>>(new Set());
	const toastTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// Track pressed keys for online games
	const keysPressed = useRef<Set<string>>(new Set());

	// Determine active game state and status
	const isLocalMode = selectedMode === "local";
	
	// Use server state for online games, local state for local games
	const gameState = isLocalMode 
		? localGameState 
		: serverGameState;
	
	const status = isLocalMode 
		? (localStatus === "idle" ? "disconnected" : localStatus === "playing" ? "playing" : "finished")
		: onlineStatus;

	const qualityLabel =
		networkQuality === "good"
			? "Good"
			: networkQuality === "fair"
				? "Fair"
				: networkQuality === "poor"
					? "Poor"
					: "Checking";

	const qualityClasses =
		networkQuality === "good"
			? "border-green-500/70 text-green-300"
			: networkQuality === "fair"
				? "border-yellow-500/70 text-yellow-300"
				: networkQuality === "poor"
					? "border-red-500/70 text-red-300"
					: "border-gray-500/70 text-gray-300";

	// Redirect only after auth state is hydrated.
	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isLoading, router]);

	// Helper function to determine current direction from pressed keys
	const getCurrentDirection = (): "up" | "down" | "stop" => {
		const upPressed = keysPressed.current.has("w") || 
		                  keysPressed.current.has("W") || 
		                  keysPressed.current.has("ArrowUp");
		const downPressed = keysPressed.current.has("s") || 
		                    keysPressed.current.has("S") || 
		                    keysPressed.current.has("ArrowDown");

		// If both pressed, last one wins (handled by Set order)
		// If only one pressed, use that one
		// If neither pressed, stop
		if (upPressed && !downPressed) {
			return "up";
		} else if (downPressed && !upPressed) {
			return "down";
		} else if (upPressed && downPressed) {
			// Both pressed - determine which was pressed last
			// Check the order they were added to the Set
			const keys = Array.from(keysPressed.current);
			const lastKey = keys[keys.length - 1];
			if (lastKey === "w" || lastKey === "W" || lastKey === "ArrowUp") {
				return "up";
			} else {
				return "down";
			}
		}
		return "stop";
	};

	// Keyboard Controls for Online Games
	useEffect(() => {
		if (isLocalMode || status !== "playing") return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
				e.preventDefault();

				// Add key to pressed set
				const hadKey = keysPressed.current.has(e.key);
				
				// If key is already pressed, remove it first (to update "last pressed" order)
				if (hadKey) {
					keysPressed.current.delete(e.key);
				}
				
				// Add the key
				keysPressed.current.add(e.key);

				// Determine current direction based on ALL pressed keys
				const direction = getCurrentDirection();

				// Send current direction to server
				sendMove(direction);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].includes(e.key)) {
				e.preventDefault();
				
				// Remove key from pressed set
				keysPressed.current.delete(e.key);

				// Determine new direction based on remaining pressed keys
				const direction = getCurrentDirection();

				// Send current direction to server
				sendMove(direction);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [sendMove, status, isLocalMode]);

	// Clear pressed keys when tab loses focus or becomes hidden
	useEffect(() => {
		const clearInputState = () => {
			keysPressed.current.clear();
			sendMove("stop");
		};

		const handleBlur = () => {
			clearInputState();
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				clearInputState();
			}
		};

		window.addEventListener("blur", handleBlur);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.removeEventListener("blur", handleBlur);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [sendMove]);

	// Reset keys when game ends
	useEffect(() => {
		if (status !== "playing") {
			keysPressed.current.clear();
		}
	}, [status]);

	useEffect(() => {
		const unlocked = gameOverData?.unlockedAchievements;
		if (!unlocked || unlocked.length === 0) return;

		const unseen = unlocked.filter((achievement) => {
			if (displayedAchievementKeysRef.current.has(achievement.key)) {
				return false;
			}

			displayedAchievementKeysRef.current.add(achievement.key);
			return true;
		});

		if (unseen.length === 0) return;

		setAchievementToasts((previous) => [...previous, ...unseen]);
	}, [gameOverData]);

	useEffect(() => {
		if (achievementToasts.length === 0) return;

		// Get the most recent achievement (last in array)
		const latestAchievement = achievementToasts[achievementToasts.length - 1];

		// Skip if this achievement already has a timer
		if (toastTimersRef.current.has(latestAchievement.id)) {
			return;
		}

		const timer = setTimeout(() => {
			setAchievementToasts((previous) =>
				previous.filter((a) => a.id !== latestAchievement.id)
			);
			toastTimersRef.current.delete(latestAchievement.id);
		}, 2500);

		toastTimersRef.current.set(latestAchievement.id, timer);

		return () => {
			clearTimeout(timer);
			toastTimersRef.current.delete(latestAchievement.id);
		};
	}, [achievementToasts]);

	useEffect(() => {
		return () => {
			for (const timer of toastTimersRef.current.values()) {
				clearTimeout(timer);
			}
			toastTimersRef.current.clear();
		};
	}, []);

	const handleDismissAchievement = (achievementKey: string) => {
		setAchievementToasts((previous) => {
			const toRemove = previous.find((a) => a.key === achievementKey);
			if (toRemove && toastTimersRef.current.has(toRemove.id)) {
				clearTimeout(toastTimersRef.current.get(toRemove.id)!);
				toastTimersRef.current.delete(toRemove.id);
			}
			return previous.filter((achievement) => achievement.key !== achievementKey);
		});
	};

	const handleJoinGame = () => {
		if (selectedMode === "local") {
			startLocalGame(localTargetScore);
		} else if (selectedMode === "ai") {
			joinAIGame(aiDifficulty);
		} else {
			joinGame();
		}
	};

	const handlePlayAgain = () => {
		// Clear pressed keys
		keysPressed.current.clear();

		if (isLocalMode) {
			stopLocalGame();
		} else {
			// Ensure paddle input is reset before leaving finished state.
			sendMove("stop");
			resetGameSession();
		}

		void router.replace("/game");
	};

	if (isLoading || !isAuthenticated) {
		return null;
	}

	return (
		<div className="flex flex-col items-center pt-20 min-h-screen">
			<div className="fixed top-24 right-4 z-[90] flex w-[320px] max-w-[90vw] flex-col gap-3">
				{achievementToasts.map((achievement, index) => (
					<div
						key={`${achievement.id}-${index}`}
						onClick={() => handleDismissAchievement(achievement.key)}
						className="cursor-pointer rounded-xl border border-green-500/70 bg-black/85 p-4 shadow-[0_0_18px_rgba(0,255,0,0.25)] backdrop-blur-md transition-all hover:border-green-500 hover:shadow-[0_0_24px_rgba(0,255,0,0.35)]"
					>
						<p className="text-xs uppercase tracking-wide text-green-400">Achievement unlocked</p>
						<div className="mt-2 flex items-start gap-3">
							<span className="text-2xl">{achievement.icon}</span>
							<div>
								<p className="text-base font-bold text-white">{achievement.name}</p>
								<p className="mt-1 text-sm text-gray-300">{achievement.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{connectionError && (
				<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[85]">
					<div className="rounded-lg bg-red-900/90 border border-red-600 px-4 py-2 text-red-100 text-sm">
						{connectionError}
					</div>
				</div>
			)}

			{!isLocalMode && status !== "disconnected" && (
				<div className="fixed top-24 left-4 z-[86]">
					<div className={`rounded-lg border bg-black/80 px-3 py-2 text-xs md:text-sm ${qualityClasses}`}>
						<div className="font-semibold">Network: {qualityLabel}</div>
						<div>
							Latency: {latencyMs === null ? "--" : `${latencyMs} ms`}
						</div>
					</div>
				</div>
			)}

			<h1
				className="text-4xl font-bold mb-8 glow-text"
				style={{ color: "var(--tron-blue)" }}
			>
				PONG ARENA
			</h1>

			{/* Disconnected State - Mode Selection */}
			{status === "disconnected" && (
				<div className="text-center">
					{/* Mode Selection */}
					<div className="mb-8">
						<p className="text-white text-lg mb-4 font-semibold">Choose Game Mode:</p>
						<div className="flex gap-4 justify-center mb-6 flex-wrap max-w-4xl">
							{/* Multiplayer Mode */}
							<button
								onClick={() => setSelectedMode("pvp")}
								className={`px-6 py-4 font-bold text-lg rounded-lg transition-all duration-300 flex-1 min-w-[200px] ${
									selectedMode === "pvp"
										? "bg-[var(--tron-blue)] text-black shadow-[0_0_20px_rgba(0,210,255,0.5)]"
										: "bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-[var(--tron-blue)] hover:text-white"
								}`}
							>
								<div className="flex flex-col items-center">
									<span className="text-2xl mb-1">👥</span>
									<span>ONLINE</span>
									<span className="text-xs mt-1 opacity-75">Play vs Player</span>
								</div>
							</button>

							{/* AI Mode */}
							<button
								onClick={() => setSelectedMode("ai")}
								className={`px-6 py-4 font-bold text-lg rounded-lg transition-all duration-300 flex-1 min-w-[200px] ${
									selectedMode === "ai"
										? "bg-[var(--tron-orange)] text-black shadow-[0_0_20px_rgba(255,157,0,0.5)]"
										: "bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-[var(--tron-orange)] hover:text-white"
								}`}
							>
								<div className="flex flex-col items-center">
									<span className="text-2xl mb-1">🤖</span>
									<span>vs AI</span>
									<span className="text-xs mt-1 opacity-75">Practice Mode</span>
								</div>
							</button>

							{/* Local Mode */}
							<button
								onClick={() => setSelectedMode("local")}
								className={`px-6 py-4 font-bold text-lg rounded-lg transition-all duration-300 flex-1 min-w-[200px] ${
									selectedMode === "local"
										? "bg-green-500 text-black shadow-[0_0_20px_rgba(0,255,0,0.5)]"
										: "bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-green-500 hover:text-white"
								}`}
							>
								<div className="flex flex-col items-center">
									<span className="text-2xl mb-1">🎮</span>
									<span>LOCAL</span>
									<span className="text-xs mt-1 opacity-75">Same Keyboard</span>
								</div>
							</button>
						</div>

						{selectedMode === "ai" && (
							<div className="mt-6 flex flex-col items-center gap-3">
								<p className="text-white text-sm uppercase tracking-wide">AI difficulty</p>
								<div className="flex gap-3 flex-wrap justify-center">
									{(["easy", "normal", "hard"] as AIDifficulty[]).map((difficulty) => (
										<button
											key={difficulty}
											onClick={() => setAiDifficulty(difficulty)}
											className={`px-4 py-2 rounded-md border text-sm font-semibold transition-all duration-300 ${
												aiDifficulty === difficulty
													? "bg-[var(--tron-orange)] text-black border-[var(--tron-orange)] shadow-[0_0_16px_rgba(255,157,0,0.35)]"
													: "bg-gray-800 text-gray-300 border-gray-700 hover:border-[var(--tron-orange)] hover:text-white"
											}`}
										>
											{difficulty.toUpperCase()}
										</button>
									))}
								</div>
							</div>
						)}

						{selectedMode === "local" && (
							<div className="mt-6 flex flex-col items-center gap-3">
								<p className="text-white text-sm uppercase tracking-wide">Play until</p>
								<div className="flex gap-3 flex-wrap justify-center">
									{([3, 7, 11] as const).map((score) => (
										<button
											key={score}
											onClick={() => setLocalTargetScore(score)}
											className={`px-4 py-2 rounded-md border text-sm font-semibold transition-all duration-300 ${
												localTargetScore === score
													? "bg-green-500 text-black border-green-400 shadow-[0_0_16px_rgba(0,255,0,0.35)]"
													: "bg-gray-800 text-gray-300 border-gray-700 hover:border-green-500 hover:text-white"
											}`}
										>
											{score}
										</button>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Join Button */}
					<button
						onClick={handleJoinGame}
						className={`px-10 py-5 font-bold text-xl rounded-lg transition-all duration-300 ${
							selectedMode === "pvp"
								? "bg-[var(--tron-blue)] text-black hover:bg-white shadow-[0_0_20px_rgba(0,210,255,0.5)]"
								: selectedMode === "ai"
								? "bg-[var(--tron-orange)] text-black hover:bg-white shadow-[0_0_20px_rgba(255,157,0,0.5)]"
								: "bg-green-500 text-black hover:bg-white shadow-[0_0_20px_rgba(0,255,0,0.5)]"
						}`}
					>
						{selectedMode === "pvp" && "FIND OPPONENT"}
						{selectedMode === "ai" && "START AI MATCH"}
						{selectedMode === "local" && "START LOCAL MATCH"}
					</button>
					<p className="text-white mt-4 text-sm">
						{selectedMode === "pvp" && "You'll be matched with another player"}
							{selectedMode === "ai" && `Play against the computer AI (${aiDifficulty})`}
						{selectedMode === "local" && `Two players on the same keyboard (first to ${localTargetScore})`}
					</p>

					<div className="mt-8 w-full max-w-4xl rounded-xl border border-[var(--tron-blue)]/40 bg-black/60 p-6 text-left backdrop-blur-md">
						<h2 className="text-xl font-bold text-[var(--tron-blue)]">Game Rules</h2>
						<ul className="mt-4 space-y-2 text-sm text-gray-200">
							<li><span className="font-semibold text-[var(--tron-orange)]">Goal:</span> score by sending the ball past your opponent's paddle.</li>
							<li><span className="font-semibold text-[var(--tron-orange)]">Paddles:</span> keep your paddle in play to block and return the ball.</li>
							<li><span className="font-semibold text-[var(--tron-orange)]">Controls:</span> use W/S or Arrow Up/Arrow Down for movement.</li>
							<li><span className="font-semibold text-[var(--tron-orange)]">Win condition:</span> PvP and AI are first to 7, Local is first to the selected target (3, 7, or 11).</li>
							<li><span className="font-semibold text-[var(--tron-orange)]">Fair play:</span> if an online opponent disconnects and cannot return in time, the match ends.</li>
						</ul>
					</div>
				</div>
			)}

			{/* Waiting State */}
			{status === "waiting" && (
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-[var(--tron-blue)] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
					<p className="text-xl text-white">Searching for opponent...</p>
					<p className="text-sm text-gray-400 mt-2">
						Open another browser tab to test multiplayer
					</p>
					<button
						onClick={cancelMatchmaking}
						className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
					>
						Cancel Matchmaking
					</button>
				</div>
			)}

			{/* Playing State */}
			{status === "playing" && gameState && (
				<div className="flex flex-col items-center">
					{!isLocalMode && playerLabels && (
						<div className="mb-3 w-full max-w-[1200px] px-2 md:px-4 flex items-center justify-between gap-3">
							<div className="max-w-[48%] truncate rounded-md border border-[var(--tron-blue)]/60 bg-black/60 px-3 py-1 text-xs font-semibold text-[var(--tron-blue)] md:text-sm">
								{playerLabels.left}
							</div>
							<div className="max-w-[48%] truncate rounded-md border border-[var(--tron-orange)]/60 bg-black/60 px-3 py-1 text-xs font-semibold text-[var(--tron-orange)] md:text-sm text-right">
								{playerLabels.right}
							</div>
						</div>
					)}

					<GameCanvas gameState={gameState} />
				</div>
			)}

			{/* Paused State */}
			{status === "paused" && gameState && (
				<div className="flex flex-col items-center relative">
					{playerLabels && (
						<div className="mb-3 w-full max-w-[1200px] px-2 md:px-4 flex items-center justify-between gap-3">
							<div className="max-w-[48%] truncate rounded-md border border-[var(--tron-blue)]/60 bg-black/60 px-3 py-1 text-xs font-semibold text-[var(--tron-blue)] md:text-sm">
								{playerLabels.left}
							</div>
							<div className="max-w-[48%] truncate rounded-md border border-[var(--tron-orange)]/60 bg-black/60 px-3 py-1 text-xs font-semibold text-[var(--tron-orange)] md:text-sm text-right">
								{playerLabels.right}
							</div>
						</div>
					)}
					<GameCanvas gameState={gameState} />
					
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl max-w-md z-50 backdrop-blur-sm">
						<h3 className="text-2xl font-bold text-yellow-500 text-center mb-4">
							⏸️ GAME PAUSED
						</h3>
						<p className="text-white text-center mb-4">
							Opponent disconnected. Waiting for reconnection...
						</p>
						
						<div className="flex flex-col items-center gap-3">
							<div className="text-4xl font-bold text-yellow-500">
								{reconnectionCountdown}s
							</div>
							
							<div className="w-full bg-gray-700 rounded-full h-3">
								<div 
									className="bg-yellow-500 h-3 rounded-full transition-all duration-1000"
									style={{ width: `${(reconnectionCountdown / 10) * 100}%` }}
								/>
							</div>
							
							<p className="text-sm text-gray-400">
								Game will be abandoned if opponent doesn't reconnect
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Game Over State */}
			{status === "finished" && (
				<div className="text-center">
					<div className="p-8 bg-black/60 border-2 border-[var(--tron-blue)] rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(0,210,255,0.2)] max-w-md">
						{/* Online game - opponent disconnected */}
						{gameOverData?.message === "opponentDisconnected" ? (
							<>
								<h2 className="text-3xl font-bold text-[var(--tron-orange)] mb-4">
									OPPONENT DISCONNECTED
								</h2>
								<p className="text-white mb-6">Your opponent left the game</p>
							</>
						) : (
							<>
								<h2 className="text-3xl font-bold text-[var(--tron-blue)] mb-4">
									GAME OVER
								</h2>

								{/* Local game result */}
								{selectedMode === "local" && localWinner && gameState && (
									<div className="text-white mb-6">
										<p className="text-2xl mb-4 font-bold">
											{localWinner === "left" ? (
												<span className="text-[var(--tron-blue)]">🎉 LEFT PLAYER WINS! 🎉</span>
											) : (
												<span className="text-[var(--tron-orange)]">🎉 RIGHT PLAYER WINS! 🎉</span>
											)}
										</p>
										<div className="flex justify-center items-center gap-4 text-xl">
											<span className="text-[var(--tron-blue)]">
												{gameState.score.left}
											</span>
											<span className="text-gray-400">-</span>
											<span className="text-[var(--tron-orange)]">
												{gameState.score.right}
											</span>
										</div>
									</div>
								)}

								{/* Online game result (AI or PvP) */}
								{!isLocalMode && gameOverData?.winner && gameOverData.score && (
									<div className="text-white mb-6">
										{gameOverData.mode === "ai" ? (
											<p className="text-2xl mb-4 font-bold">
												<span className={gameOverData.winner === "left" ? "text-green-500" : "text-red-500"}>
													{gameOverData.winnerUsername
														? `${gameOverData.winnerUsername} WINS!`
														: gameOverData.winner === "left"
															? "YOU WIN!"
															: "AI WINS"}
												</span>
											</p>
										) : (
											<p className="text-2xl mb-4 font-bold">
												<span className={gameOverData.winner === "left" ? "text-[var(--tron-blue)]" : "text-[var(--tron-orange)]"}>
													{gameOverData.winnerUsername
														? `${gameOverData.winnerUsername} WINS!`
														: gameOverData.winner === "left"
															? "LEFT PLAYER WINS!"
															: "RIGHT PLAYER WINS!"}
												</span>
											</p>
										)}
										<div className="flex justify-center items-center gap-4 text-xl">
											<span className="text-[var(--tron-blue)]">
												{gameOverData.score.left}
											</span>
											<span className="text-gray-400">-</span>
											<span className="text-[var(--tron-orange)]">
												{gameOverData.score.right}
											</span>
										</div>
									</div>
								)}
							</>
						)}

						<div className="flex gap-3 justify-center">
							<button
								onClick={handlePlayAgain}
								className="px-8 py-3 bg-[var(--tron-blue)] text-black font-bold rounded-lg hover:bg-white transition-all duration-300 shadow-[0_0_15px_rgba(0,210,255,0.4)]"
							>
								PLAY AGAIN
							</button>
							<button
								onClick={() => {
									keysPressed.current.clear();
									if (isLocalMode) {
										stopLocalGame();
									}
									router.push("/");
								}}
								className="px-8 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-300"
							>
								MAIN MENU
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
