// services/frontend/src/components/GameCanvas.tsx
import { useEffect, useRef, useState } from "react";

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
}

interface GameCanvasProps {
	gameState: GameState | null;
}

// Backend world dimensions (from constants.ts)
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 600;

export default function GameCanvas({ gameState }: GameCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

	// Handle responsive canvas sizing
	useEffect(() => {
		const updateCanvasSize = () => {
			if (!containerRef.current) return;

			const maxWidth = Math.max(320, Math.min(window.innerWidth - 40, 1200)); // Max 1200px or window width
			const maxHeight = Math.max(192, window.innerHeight - 300); // Leave space for UI

			// Maintain aspect ratio (1000:600 = 5:3)
			const aspectRatio = WORLD_WIDTH / WORLD_HEIGHT;
			let width = maxWidth;
			let height = width / aspectRatio;

			// If height is too tall, scale by height instead
			if (height > maxHeight) {
				height = maxHeight;
				width = height * aspectRatio;
			}

			// Keep dimensions strictly positive to avoid negative scale/radius rendering bugs.
			setDimensions({
				width: Math.max(1, Math.floor(width)),
				height: Math.max(1, Math.floor(height)),
			});
		};

		updateCanvasSize();
		window.addEventListener("resize", updateCanvasSize);
		return () => window.removeEventListener("resize", updateCanvasSize);
	}, []);

	// Render game state
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !gameState) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Calculate scale factor (backend coords → canvas coords)
		const scale = dimensions.width / WORLD_WIDTH;

		// Helper: Transform backend coordinates to canvas coordinates
		const toCanvasX = (x: number) => {
			// Backend: origin at center, X: -500 to 500
			// Canvas: origin at top-left, X: 0 to width
			return ((x * scale) + dimensions.width / 2);
		};

		const toCanvasY = (y: number) => {
			// Backend: origin at center, Y: -300 to 300 (positive = up)
			// Canvas: origin at top-left, Y: 0 to height (positive = down)
			return (dimensions.height / 2 - (y * scale));
		};

		// Clear canvas
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw center line
		ctx.strokeStyle = "#00d2ff";
		ctx.lineWidth = 2;
		ctx.setLineDash([10 * scale, 10 * scale]);
		ctx.beginPath();
		ctx.moveTo(canvas.width / 2, 0);
		ctx.lineTo(canvas.width / 2, canvas.height);
		ctx.stroke();
		ctx.setLineDash([]);

		// Draw left paddle (blue)
		const leftPaddleX = toCanvasX(gameState.leftPaddle.position.x - (gameState.leftPaddle.width / 2));
		const leftPaddleY = toCanvasY(gameState.leftPaddle.position.y + (gameState.leftPaddle.height / 2));
		const paddleWidth = gameState.leftPaddle.width * scale;
		const paddleHeight = gameState.leftPaddle.height * scale;

		ctx.fillStyle = "#00d2ff";
		ctx.shadowColor = "#00d2ff";
		ctx.shadowBlur = 15;
		ctx.fillRect(leftPaddleX, leftPaddleY, paddleWidth, paddleHeight);
		ctx.shadowBlur = 0;

		// Draw right paddle (pink)
		const rightPaddleX = toCanvasX(gameState.rightPaddle.position.x - (gameState.rightPaddle.width / 2));
		const rightPaddleY = toCanvasY(gameState.rightPaddle.position.y + (gameState.rightPaddle.height / 2));

		ctx.fillStyle = "#ff4ec8";
		ctx.shadowColor = "#ff4ec8";
		ctx.shadowBlur = 15;
		ctx.fillRect(rightPaddleX, rightPaddleY, paddleWidth, paddleHeight);
		ctx.shadowBlur = 0;

		// Draw ball (white with glow)
		const ballX = toCanvasX(gameState.ball.position.x);
		const ballY = toCanvasY(gameState.ball.position.y);
		const ballRadius = Math.max(1, Math.abs(gameState.ball.radius * scale));

		ctx.fillStyle = "#ffffff";
		ctx.shadowColor = "#ffffff";
		ctx.shadowBlur = 20;
		ctx.beginPath();
		ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;

		// Draw scores (responsive font size)
		const fontSize = Math.floor(48 * scale);
		ctx.font = `${fontSize}px monospace`;
		ctx.textAlign = "center";

		// Left score (blue)
		ctx.fillStyle = "#00d2ff";
		ctx.shadowColor = "#00d2ff";
		ctx.shadowBlur = 10;
		ctx.fillText(
			gameState.score.left.toString(),
			canvas.width / 4,
			fontSize + 20
		);

		// Right score (pink)
		ctx.fillStyle = "#ff4ec8";
		ctx.shadowColor = "#ff4ec8";
		ctx.shadowBlur = 10;
		ctx.fillText(
			gameState.score.right.toString(),
			(canvas.width * 3) / 4,
			fontSize + 20
		);
		ctx.shadowBlur = 0;
	}, [gameState, dimensions]);

	return (
		<div ref={containerRef} className="flex flex-col items-center w-full">
			<canvas
				ref={canvasRef}
				width={dimensions.width}
				height={dimensions.height}
				className="border-2 border-[var(--tron-blue)] rounded-lg shadow-[0_0_30px_rgba(0,210,255,0.3)] bg-black"
				style={{
					maxWidth: "100%",
					height: "auto",
				}}
			/>
		</div>
	);
}
