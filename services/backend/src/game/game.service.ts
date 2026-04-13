import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { GameInstances } from './models/game-instances';
import { Player } from './models/player';
import { PlayerInput } from './models/player-input';
import { gameLoop } from './engine/game-engine';
import { GameState } from './models/game-state';

@Injectable()
export class GameService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(GameService.name);

	private instances: GameInstances = new GameInstances();
	private gameLoopInterval?: NodeJS.Timeout;

	onModuleInit() {
		this.gameLoopInterval = gameLoop(this.instances);
		this.logger.log('Game loop started');
	}

	onModuleDestroy() {
		if (this.gameLoopInterval) {
			clearInterval(this.gameLoopInterval);
			this.gameLoopInterval = undefined;
		}
	}

	createGame(id: number, player1: Player, player2: Player, difficulty: string): GameState {
		return this.instances.createGame(
			id,
			{left: player1, right: player2},
			difficulty,
			0,
		);
	}

	getGame(id: number): GameState | undefined {
		return this.instances.getGame(id);
	}

	removeGame(id: number): void {
		this.instances.removeGame(id);
	}

	addInput(
		gameId: number,
		side: 'left' | 'right',
		tick: number,
		input: PlayerInput,
	): void {
		const game = this.instances.getGame(gameId);
		if (!game) return;
		if (side === 'left') {
			game.inputQueue.left.set(tick, input);
		} else {
			game.inputQueue.right.set(tick, input);
		}
	}

	getInstances(): GameInstances {
		return this.instances;
	}
}