import { GAME_DEFAULTS } from "./../engine/constants";
import { GameInstances } from "./../models/game-instances";
import { aiPlayer } from "./../ai/ai-player";
import { updateGame} from "./../engine/physics";
import { updateScore, checkEndGame} from "./../engine/rules";

function loop(instances: GameInstances)
{
	const keys = instances.getKeysSnapshot();
	for (const id of keys)
	{
		const game = instances.getGame(id);
		if (!game) continue;
		if (game.status === 'running')
		{
			if (game.players.right.id === 'AI')
				aiPlayer(game);
			updateGame(game);
			updateScore(game);
			checkEndGame(game);
			game.tick_increment();
		}
	}
}

export function gameLoop(instances: GameInstances)
{
	return setInterval(() =>
	{
		loop(instances);
	}, GAME_DEFAULTS.delta * 1000);
}
