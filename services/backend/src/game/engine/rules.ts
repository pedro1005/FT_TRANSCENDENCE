import { WORLD_DEFAULTS, SCORE_DEFAULTS } from "./../engine/constants";
import { GameState } from "./../models/game-state";

export function updateScore(game: GameState): void
{
	if (game.ball.position.x - game.ball.radius >= WORLD_DEFAULTS.width / 2)
	{
		game.score.left++;
		game.ball.reset();
	}
	if (game.ball.position.x + game.ball.radius <= -WORLD_DEFAULTS.width / 2)
	{
		game.score.right++;
		game.ball.reset();
	}

}

export function checkEndGame(game: GameState): void
{
	if (game.score.left === SCORE_DEFAULTS.max || game.score.right === SCORE_DEFAULTS.max)
	{
		game.status = 'finished';
	}

}
