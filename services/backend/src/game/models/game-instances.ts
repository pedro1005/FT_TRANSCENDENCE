import { GameState } from "./game-state";
import { Player } from "./player";

export class GameInstances
{
    private games = new Map<number, GameState>();

	getSize(): number
	{
		return (this.games.size);
	}

    createGame(id: number, players: {left: Player, right: Player},
	difficulty: string, tick: number): GameState
	{
        const game = new GameState(id, players, difficulty, tick);
        this.games.set(id, game);
        return game;
    }

	getGame(id: number): GameState | undefined
	{
        return this.games.get(id);
    }

    removeGame(id: number): void
	{
        this.games.delete(id);
    }

	getKeysSnapshot(): number[]
	{
    	return Array.from(this.games.keys());
 	}

}
