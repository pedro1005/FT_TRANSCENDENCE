import { useState, useEffect, useRef, useCallback } from "react";

// Mirror backend constants
const GAME_DELTA = 0.0167; // 60Hz
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 600;
const BALL_RADIUS = 10;
const BALL_INITIAL_VELOCITY = { x: 400, y: 0 };
const BALL_VELOCITY_INCREASE = 25;
const MAX_BALL_VELOCITY = 800;  // Prevent infinite acceleration
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 120;
const PADDLE_VELOCITY = 400;
const PADDLE_POSITION_X = { left: -470, right: 470 };
const PADDLE_Y_OFFSET = 30;  // Initial Y offset to prevent centered start
const DEFAULT_MAX_SCORE = 7;

interface Position {
	x: number;
	y: number;
}

interface Ball {
	position: Position;
	velocity: Position;
	radius: number;
}

interface Paddle {
	position: Position;
	width: number;
	height: number;
}

interface GameState {
	ball: Ball;
	leftPaddle: Paddle;
	rightPaddle: Paddle;
	score: { left: number; right: number };
	tick: number;
}

type GameStatus = "idle" | "playing" | "finished";

// === INPUT VALIDATION ===
const isValidDirection = (dir: unknown): dir is "up" | "down" | "stop" => {
	return dir === "up" || dir === "down" || dir === "stop";
};

const isFiniteNumber = (val: unknown): val is number => {
	return typeof val === "number" && Number.isFinite(val);
};

export function useLocalGame() {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [status, setStatus] = useState<GameStatus>("idle");
	const [winner, setWinner] = useState<"left" | "right" | null>(null);
	const [maxScore, setMaxScore] = useState<number>(DEFAULT_MAX_SCORE);

	const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const keysPressed = useRef<Set<string>>(new Set());

	const resolveDirection = useCallback((upKeys: string[], downKeys: string[]): "up" | "down" | "stop" => {
		const activeKeys = [...keysPressed.current];

		for (let i = activeKeys.length - 1; i >= 0; i--) {
			const key = activeKeys[i];
			if (upKeys.includes(key)) {
				return "up";
			}
			if (downKeys.includes(key)) {
				return "down";
			}
		}

		return "stop";
	}, []);

	// Initialize game state
	const initializeGame = useCallback(() => {
		// Random Y offset for paddles
		const leftOffset = (Math.random() - 0.5) * PADDLE_Y_OFFSET;
		const rightOffset = (Math.random() - 0.5) * PADDLE_Y_OFFSET;

		const initialState: GameState = {
			ball: {
				position: { x: 0, y: 0 },
				velocity: { ...BALL_INITIAL_VELOCITY },
				radius: BALL_RADIUS,
			},
			leftPaddle: {
				position: { x: PADDLE_POSITION_X.left, y: leftOffset },
				width: PADDLE_WIDTH,
				height: PADDLE_HEIGHT,
			},
			rightPaddle: {
				position: { x: PADDLE_POSITION_X.right, y: rightOffset },
				width: PADDLE_WIDTH,
				height: PADDLE_HEIGHT,
			},
			score: { left: 0, right: 0 },
			tick: 0,
		};
		setGameState(initialState);
		setStatus("playing");
		setWinner(null);
	}, []);

	// Reset ball after score
	const resetBall = useCallback((state: GameState, service: number) => {
		state.ball.position = { x: 0, y: 0 };
		state.ball.velocity = {
			x: BALL_INITIAL_VELOCITY.x * service,
			y: 0,
		};
	}, []);

	// Update paddle position based on input
	const updatePaddle = useCallback((paddle: Paddle, direction: "up" | "down" | "stop") => {
		// VALIDATION: Ensure direction is valid
		if (!isValidDirection(direction)) {
			console.warn(`Invalid direction: ${direction}`);
			return;
		}

		// VALIDATION: Ensure paddle position is a valid number
		if (!isFiniteNumber(paddle.position.y)) {
			console.warn("Invalid paddle.position.y");
			paddle.position.y = 0;
			return;
		}

		const maxY = WORLD_HEIGHT / 2 - paddle.height / 2;

		if (direction === "up") {
			paddle.position.y += PADDLE_VELOCITY * GAME_DELTA;
			if (paddle.position.y > maxY) {
				paddle.position.y = maxY;
			}
		} else if (direction === "down") {
			paddle.position.y -= PADDLE_VELOCITY * GAME_DELTA;
			if (paddle.position.y < -maxY) {
				paddle.position.y = -maxY;
			}
		}
	}, []);

	// Check ball-paddle collision
	const checkPaddleCollision = useCallback((ball: Ball, paddle: Paddle) => {
		const closestX = Math.max(
			paddle.position.x - paddle.width / 2,
			Math.min(ball.position.x, paddle.position.x + paddle.width / 2)
		);
		const closestY = Math.max(
			paddle.position.y - paddle.height / 2,
			Math.min(ball.position.y, paddle.position.y + paddle.height / 2)
		);

		const dx = ball.position.x - closestX;
		const dy = ball.position.y - closestY;

		if (dx * dx + dy * dy <= ball.radius * ball.radius) {
			// Collision detected
			const overlapX =
				paddle.width / 2 + ball.radius - Math.abs(ball.position.x - paddle.position.x);
			const overlapY =
				paddle.height / 2 + ball.radius - Math.abs(ball.position.y - paddle.position.y);

			const horizontallyAligned =
				ball.position.x + ball.radius > paddle.position.x - paddle.width / 2 &&
				ball.position.x - ball.radius < paddle.position.x + paddle.width / 2;

			const hitHorizontal = overlapX < overlapY;

			// Only handle side hits (horizontal collisions), skip top/bottom hits
			if (!hitHorizontal) {
				return; // TOP or BOTTOM hit - DISABLED FOR TESTING
			}

			if (hitHorizontal && horizontallyAligned) {
				// Reverse and increase horizontal velocity
				const dirX = Math.sign(ball.position.x - paddle.position.x);
				ball.position.x = paddle.position.x + dirX * (paddle.width / 2 + ball.radius);

				ball.velocity.x = -ball.velocity.x;
				ball.velocity.x += ball.velocity.x > 0 ? BALL_VELOCITY_INCREASE : -BALL_VELOCITY_INCREASE;

				// Cap velocity to prevent infinite acceleration
				if (Math.abs(ball.velocity.x) > MAX_BALL_VELOCITY) {
					ball.velocity.x = Math.sign(ball.velocity.x) * MAX_BALL_VELOCITY;
				}

				// Add spin based on where ball hit paddle
				ball.velocity.y =
					((ball.position.y - paddle.position.y) / (paddle.height / 2)) *
					Math.abs(ball.velocity.x);
			}
		}
	}, []);

	// Game loop
	const gameLoop = useCallback(() => {
		setGameState((prevState: GameState | null) => {
			if (!prevState || status !== "playing") return prevState;

			const state = JSON.parse(JSON.stringify(prevState)) as GameState;

			// Update paddle positions based on keys
			let leftDirection: "up" | "down" | "stop" = "stop";
			let rightDirection: "up" | "down" | "stop" = "stop";

			leftDirection = resolveDirection(["w", "W"], ["s", "S"]);
			rightDirection = resolveDirection(["ArrowUp"], ["ArrowDown"]);

			updatePaddle(state.leftPaddle, leftDirection);
			updatePaddle(state.rightPaddle, rightDirection);

			// Update ball position
			state.ball.position.x += state.ball.velocity.x * GAME_DELTA;
			state.ball.position.y += state.ball.velocity.y * GAME_DELTA;

			// VALIDATION: Ensure ball position is finite (prevent NaN propagation)
			if (!isFiniteNumber(state.ball.position.x) || !isFiniteNumber(state.ball.position.y)) {
				console.warn("Ball position became NaN, resetting");
				state.ball.position = { x: 0, y: 0 };
				state.ball.velocity = { ...BALL_INITIAL_VELOCITY };
			}

			// Wall collision (top/bottom)
			if (state.ball.position.y + state.ball.radius >= WORLD_HEIGHT / 2) {
				state.ball.position.y = WORLD_HEIGHT / 2 - state.ball.radius;
				state.ball.velocity.y = -state.ball.velocity.y;
			} else if (state.ball.position.y - state.ball.radius <= -WORLD_HEIGHT / 2) {
				state.ball.position.y = -WORLD_HEIGHT / 2 + state.ball.radius;
				state.ball.velocity.y = -state.ball.velocity.y;
			}

			// Paddle collision
			checkPaddleCollision(state.ball, state.leftPaddle);
			checkPaddleCollision(state.ball, state.rightPaddle);

			// Score detection
			if (state.ball.position.x - state.ball.radius >= WORLD_WIDTH / 2) {
				// Left player scores
				state.score.left++;
				resetBall(state, -1);
			} else if (state.ball.position.x + state.ball.radius <= -WORLD_WIDTH / 2) {
				// Right player scores
				state.score.right++;
				resetBall(state, 1);
			}

			// VALIDATION: Ensure scores are valid integers
			if (!Number.isInteger(state.score.left)) state.score.left = 0;
			if (!Number.isInteger(state.score.right)) state.score.right = 0;

			// Check win condition
			if (state.score.left >= maxScore) {
				setStatus("finished");
				setWinner("left");
			} else if (state.score.right >= maxScore) {
				setStatus("finished");
				setWinner("right");
			}

			state.tick++;
			return state;
		});
	}, [status, maxScore, updatePaddle, checkPaddleCollision, resetBall, resolveDirection]);

	// Start game
	const startGame = useCallback((targetScore: number = DEFAULT_MAX_SCORE) => {
		setMaxScore(targetScore);
		initializeGame();
	}, [initializeGame]);

	// Stop game
	const stopGame = useCallback(() => {
		if (gameLoopRef.current) {
			clearInterval(gameLoopRef.current);
			gameLoopRef.current = null;
		}
		setStatus("idle");
		setGameState(null);
		setWinner(null);
	}, []);

	// Setup game loop when playing
	useEffect(() => {
		if (status === "playing") {
			gameLoopRef.current = setInterval(gameLoop, GAME_DELTA * 1000);
		} else if (gameLoopRef.current) {
			clearInterval(gameLoopRef.current);
			gameLoopRef.current = null;
		}

		return () => {
			if (gameLoopRef.current) {
				clearInterval(gameLoopRef.current);
			}
		};
	}, [status, gameLoop]);

	// Keyboard event handlers
	useEffect(() => {
		const VALID_KEYS = ["w", "W", "s", "S", "ArrowUp", "ArrowDown"];

		const handleKeyDown = (e: KeyboardEvent) => {
			if (status !== "playing") return;
			
			// VALIDATION: Only accept valid keys
			if (!VALID_KEYS.includes(e.key)) return;
			
			e.preventDefault();
			keysPressed.current.delete(e.key);
			keysPressed.current.add(e.key);
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			// VALIDATION: Only process valid keys
			if (!VALID_KEYS.includes(e.key)) return;
			
			e.preventDefault();
			keysPressed.current.delete(e.key);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, [status]);

	return {
		gameState,
		status,
		winner,
		maxScore,
		startGame,
		stopGame,
	};
}