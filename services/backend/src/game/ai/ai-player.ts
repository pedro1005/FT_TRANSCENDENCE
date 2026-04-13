import { AI_DEFAULTS } from "./../ai/ai-user.constants";
import { GameState } from "./../models/game-state";
import { PlayerInput } from "./../models/player-input";

export function aiPlayer(game: GameState)
{
    let direction: "up" | "down" | "stop" = "stop";
	const config = AI_DEFAULTS[game.difficulty];

    const ballComingTowardAI = game.ball.velocity.x > 0;

    if (ballComingTowardAI)
	{
        if (Math.random() > config.reaction)
		{
            game.inputQueue.right.set(game.tick + 1, new PlayerInput("stop"));
            return;
        }
    }

    let targetY: number;
    if (ballComingTowardAI)
    {
        const jitter = (Math.random() * 2 - 1) * config.aimJitter;
        targetY = game.ball.position.y + jitter;
    }
    else
    {
        if (Math.random() < config.returnChance)
            targetY = 0;
        else
            targetY = game.paddle.right.position.y;
    }

    const error = targetY - game.paddle.right.position.y;

    if (Math.abs(error) < config.deadzone) 
        direction = "stop";
    else if (error > 0) 
        direction = "up";
    else if (error < 0)
        direction = "down";

    game.inputQueue.right.set(game.tick + 1, new PlayerInput(direction));
}
