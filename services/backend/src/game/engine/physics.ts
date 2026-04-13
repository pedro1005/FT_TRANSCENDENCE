import { GAME_DEFAULTS, PADDLE_DEFAULTS, WORLD_DEFAULTS } from "./../engine/constants";
import { Ball } from "./../models/ball";
import { Paddle } from "./../models/paddle";
import { GameState } from "./../models/game-state";
import { PlayerInput } from "../models/player-input";

function updateBall(ball: Ball): void
{
    ball.position.x += ball.velocity.x * GAME_DEFAULTS.delta;
	ball.position.y += ball.velocity.y * GAME_DEFAULTS.delta;
}

function updatePaddlePosition(paddle: Paddle, input: PlayerInput): void
{
	if (input.direction === 'up')
	{
		paddle.position.y += paddle.velocity * GAME_DEFAULTS.delta;
		if (paddle.position.y + paddle.height / 2 > PADDLE_DEFAULTS.position.ymax)
			paddle.position.y = PADDLE_DEFAULTS.position.ymax - paddle.height / 2;
	}
	else if (input.direction === 'down')
	{
		paddle.position.y -= paddle.velocity * GAME_DEFAULTS.delta;
		if (paddle.position.y - paddle.height / 2 < -PADDLE_DEFAULTS.position.ymax)
			paddle.position.y = -PADDLE_DEFAULTS.position.ymax + paddle.height / 2;
	}
}

function updatePaddle(game: GameState): void
{
	let	newInput = game.inputQueue.left.get(game.tick);
	if (newInput != undefined)
	{
		game.lastInput.left = newInput;
		updatePaddlePosition(game.paddle.left, newInput);
	}
	else
	{
		updatePaddlePosition(game.paddle.left, game.lastInput.left);
	}

	newInput = game.inputQueue.right.get(game.tick);
	if (newInput != undefined)
	{
		game.lastInput.right = newInput;
		updatePaddlePosition(game.paddle.right, newInput);
	}
	else
	{
		updatePaddlePosition(game.paddle.right, game.lastInput.right);
	}
}

function wallBounce(ball: Ball): void
{
	if (ball.position.y + ball.radius >= WORLD_DEFAULTS.height / 2)
	{
		ball.position.y = WORLD_DEFAULTS.height / 2 - ball.radius;
		ball.velocity.y = -ball.velocity.y;
	}
	else if (ball.position.y - ball.radius <= -WORLD_DEFAULTS.height / 2)
	{	
		ball.position.y = -WORLD_DEFAULTS.height / 2 + ball.radius;
		ball.velocity.y = -ball.velocity.y;
	}
}

function determineYVelocity(ball: Ball, paddle: Paddle, halfH: number)
{
	const t = (ball.position.y - paddle.position.y) / halfH;
	const mag = ball.velocity.vmin +
	Math.abs(t) * (Math.abs(ball.velocity.x) - ball.velocity.vmin);
	let sign = Math.sign(t);
	if (sign === 0)
	{
		sign = Math.sign(ball.velocity.y);
		if (sign === 0)
			sign = 1;
	}
	if (sign * mag > ball.velocity.vmax)
		ball.velocity.y = ball.velocity.vmax;
	else
		ball.velocity.y = sign * mag;
}

function collisionResponse(ball: Ball, paddle: Paddle, hitHorizontal: boolean): void
{
	const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;
	
	if (hitHorizontal)
	{
        const dirX = Math.sign(ball.position.x - paddle.position.x);
        ball.position.x = paddle.position.x + dirX * (halfW + ball.radius);
		if (Math.abs(-ball.velocity.x + dirX * ball.velocity.increase) > ball.velocity.vmax)
			ball.velocity.x = dirX * ball.velocity.vmax;
		else
			ball.velocity.x = -ball.velocity.x + dirX * ball.velocity.increase;
		determineYVelocity(ball, paddle, halfH);
	}
	else
	{
        const dirY = Math.sign(ball.position.y - paddle.position.y);
        ball.position.y = paddle.position.y + dirY * (halfH + ball.radius);
		determineYVelocity(ball, paddle, halfH);
	}
}

function paddleBounce(ball: Ball, paddle: Paddle): void
{
	const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;
	
	const closestX =
	Math.max(paddle.position.x - halfW,
	Math.min(ball.position.x, paddle.position.x + halfW))
	const closestY =
	Math.max(paddle.position.y - halfH,
	Math.min(ball.position.y, paddle.position.y + halfH))

	const dx = ball.position.x - closestX;
	const dy = ball.position.y - closestY;

	if (dx*dx + dy*dy > ball.radius * ball.radius)
	{
		return;
	}

	const overlapX = (halfW + ball.radius) -
	Math.abs(ball.position.x - paddle.position.x);
	const overlapY = (halfH + ball.radius) -
	Math.abs(ball.position.y - paddle.position.y);

	const hitHorizontal = overlapX < overlapY;

	collisionResponse(ball, paddle, hitHorizontal);
}

export function updateGame(game: GameState): void
{
    updatePaddle(game);
	updateBall(game.ball);
	wallBounce(game.ball);
	paddleBounce(game.ball, game.paddle.left);
	paddleBounce(game.ball, game.paddle.right);
}
