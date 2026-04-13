import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayDisconnect,
	OnGatewayInit,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { MatchService } from '../game/match.service';
import { Player } from '../game/models/player';
import { PlayerInput } from '../game/models/player-input';
import { PlayerMoveDto } from './dto/player-move.dto';
import { AIDifficulty, JoinAIGameDto } from './dto/join-ai-game.dto';
import { AuthenticatedGatewayBase } from './authenticated-gateway.base';
import { WsAuthMiddleware } from '../auth/ws-auth.middleware';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedSocket } from '../auth/ws-auth.middleware';
import { isAllowedOrigin } from '../common/security';

@WebSocketGateway({
	cors: {
		origin: (origin, callback) => {
			if (isAllowedOrigin(origin)) {
				return callback(null, true);
			}

			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
	},
})
export class GameGateway extends AuthenticatedGatewayBase implements OnGatewayInit, OnGatewayDisconnect {
	protected readonly logger = new Logger(GameGateway.name);

	@WebSocketServer()
	server: Server;

	constructor(
		private gameService: GameService,
		private matchService: MatchService,
		protected usersService: UsersService,
		private jwtService: JwtService,
	) {
		super(usersService);
	}

	private waitingPlayers: Socket[] = [];
	private playerRooms: Map<string, number> = new Map();
	private playerSides: Map<string, 'left' | 'right'> = new Map();
	private gameIntervals: Map<number, ReturnType<typeof setInterval> | number> = new Map();
	private gameStartTimes: Map<number, number> = new Map();
	private nextGameId: number = 1;
	private completedGames = new Set<number>();

	// Reconnection tracking (10 second grace period)
	private reconnectionTimers: Map<number, ReturnType<typeof setTimeout>> = new Map();
	private disconnectedPlayers: Map<string, {
		gameId: number;
		side: 'left' | 'right';
		disconnectedAt: Date;
	}> = new Map();

	private resolveUserId(client: Socket): string | undefined {
		const fromMap = this.getUserFromSocket(client.id);
		if (fromMap) return fromMap;
		const authClient = client as AuthenticatedSocket;
		return authClient.user?.id;
	}

	afterInit(server: Server) {
		const middleware = new WsAuthMiddleware(this.jwtService);
		server.use((socket, next) => middleware.use(socket, next));
		this.logger.log('WebSocket authentication middleware activated');
	}

	handleConnection(client: Socket) {
		super.handleConnection(client);
	}

	handleDisconnect(client: Socket) {
		const gameId = this.playerRooms.get(client.id);
		const userId = this.resolveUserId(client);

		if (gameId && userId) {
			const game = this.gameService.getGame(gameId);

			if (game && game.status !== 'finished') {
				// Check if it's an AI game (AI player can't reconnect)
				const isAIGame = game.players.left.id === 'AI' || game.players.right.id === 'AI';

				if (isAIGame) {
					// Abandon AI games immediately
					this.logger.log(`AI game ${gameId} abandoned (AI cannot reconnect)`);
					this.abandonGame(gameId, game, userId);
					this.playerRooms.delete(client.id);
					this.playerSides.delete(client.id);
					super.handleDisconnect(client);
					return;
				}

				// If game is already paused, both players have disconnected - abandon immediately
				if (game.status === 'paused') {
					this.logger.warn(`Both players disconnected from game ${gameId}. Abandoning game immediately.`);
					this.abandonGame(gameId, game, userId);
					this.playerRooms.delete(client.id);
					this.playerSides.delete(client.id);
					super.handleDisconnect(client);
					return;
				}

				// PvP game: pause and wait for reconnection
				const side = this.playerSides.get(client.id);
				this.logger.log(`Player ${userId} disconnected from PvP game ${gameId}. Pausing for 10 seconds...`);

				// Pause the game
				game.status = 'paused';

				// Store disconnection info
				this.disconnectedPlayers.set(userId, {
					gameId,
					side: side || 'left',
					disconnectedAt: new Date(),
				});

				// Notify opponent of pause
				const roomName = `game-${gameId}`;
				this.server.to(roomName).emit('opponentDisconnected', {
					message: 'Opponent disconnected. Waiting 10 seconds for reconnection...',
					countdown: 10,
				});

				// Set 10-second timeout to abandon if no reconnect
				const timeout = setTimeout(() => {
					this.logger.log(`Reconnection timeout expired for game ${gameId}`);
					this.abandonGameAfterTimeout(gameId, userId, game);
				}, 10000);

				this.reconnectionTimers.set(gameId, timeout);

				// Don't clean up yet - player might reconnect
				this.connectedUsers.delete(client.id);
				this.UserSockets.delete(userId);
				return;
			}
		}

		// Normal disconnect (not in game or game already finished)
		this.playerRooms.delete(client.id);
		this.playerSides.delete(client.id);

		this.waitingPlayers = this.waitingPlayers.filter(
			(socket) => socket.id !== client.id,
		);

		super.handleDisconnect(client);
	}

	private abandonGame(gameId: number, game: any, userId: string) {
		const timer = this.reconnectionTimers.get(gameId);
		if (timer) {
			clearTimeout(timer);
			this.reconnectionTimers.delete(gameId);
		}

		const interval = this.gameIntervals.get(gameId);
		if (interval) {
			clearInterval(interval);
			this.gameIntervals.delete(gameId);
		}

		const startTime = this.gameStartTimes.get(gameId) || Date.now();
		const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

		this.matchService.createAbandoned(
			game.players.left.id,
			game.players.right.id,
			game.score.left,
			game.score.right,
			durationSeconds,
			game.players.left.username,
			game.players.right.username,
			userId,
		).catch((err) => {
			this.logger.error(
				'Failed to save abandoned match',
				err instanceof Error ? err.stack : String(err),
			);
		});

		this.server.to(`game-${gameId}`).emit('gameOver', {
			message: 'opponentDisconnected',
			reason: 'Opponent failed to reconnect',
		});

		for (const [socketId, mappedGameId] of this.playerRooms.entries()) {
			if (mappedGameId === gameId) {
				this.playerRooms.delete(socketId);
				this.playerSides.delete(socketId);
			}
		}

		for (const [disconnectedUserId, disconnectInfo] of this.disconnectedPlayers.entries()) {
			if (disconnectInfo.gameId === gameId) {
				this.disconnectedPlayers.delete(disconnectedUserId);
			}
		}

		this.gameService.removeGame(gameId);
		this.gameStartTimes.delete(gameId);
	}

	private abandonGameAfterTimeout(gameId: number, userId: string, game: any) {
		const timer = this.reconnectionTimers.get(gameId);
		if (timer) {
			clearTimeout(timer);
			this.reconnectionTimers.delete(gameId);
		}

		this.disconnectedPlayers.delete(userId);
		this.abandonGame(gameId, game, userId);
		this.logger.log(`Game ${gameId} abandoned after reconnection timeout`);
	}

	@SubscribeMessage('reconnectToGame')
	handleReconnect(@ConnectedSocket() client: Socket) {
		const authClient = client as AuthenticatedSocket;
		const userId = authClient.user?.id;

		if (!userId) {
			client.emit('reconnectError', { message: 'User not authenticated' });
			return;
		}

		this.logger.log(`Reconnection attempt from ${authClient.user.username}`);

		const disconnectInfo = this.disconnectedPlayers.get(userId);

		if (!disconnectInfo) {
			this.logger.log(`No disconnected game for ${userId}`);
			client.emit('noActiveGame');
			return;
		}

		const { gameId, side } = disconnectInfo;
		const game = this.gameService.getGame(gameId);

		if (!game) {
			this.logger.warn(`Game ${gameId} no longer exists`);
			this.disconnectedPlayers.delete(userId);
			client.emit('noActiveGame');
			return;
		}

		// Clear timeout
		const timer = this.reconnectionTimers.get(gameId);
		if (timer) {
			clearTimeout(timer);
			this.reconnectionTimers.delete(gameId);
			this.logger.log(`Reconnection timer cleared for game ${gameId}`);
		}

		// Rejoin
		const roomName = `game-${gameId}`;
		client.join(roomName);
		this.playerRooms.set(client.id, gameId);
		this.playerSides.set(client.id, side);
		this.connectedUsers.set(client.id, userId);
		this.UserSockets.set(userId, client.id);

		// Resume
		game.status = 'running';
		this.disconnectedPlayers.delete(userId);

		// Notify both players
		this.server.to(roomName).emit('gameResumed', {
			message: 'Player reconnected! Game resumed.',
			mode: 'pvp',
			side,
			leftUsername: game.players.left.username,
			rightUsername: game.players.right.username,
		});

		// Send current game state to reconnected player
		client.emit('gameState', {
			ball: game.ball,
			leftPaddle: game.paddle.left,
			rightPaddle: game.paddle.right,
			score: game.score,
			leftUsername: game.players.left.username,
			rightUsername: game.players.right.username,
			tick: game.tick,
		});

		this.logger.log(`${authClient.user.username} reconnected to game ${gameId}`);
	}

	@SubscribeMessage('joinGame')
	handleJoinGame(@ConnectedSocket() client: Socket) {
		const authClient = client as AuthenticatedSocket;
		const clientUserId = this.resolveUserId(client);
		this.logger.log(`Client ${client.id} (${authClient.user.username}) wants to join a game`);

		if (!clientUserId) {
			client.emit('matchmakingError', {
				message: 'Unable to resolve authenticated user for matchmaking.',
			});
			return;
		}

		if (this.playerRooms.has(client.id)) {
			this.logger.warn(`Socket ${client.id} is already in a game, rejecting`);
			return;
		}

		const alreadyQueuedForUser = this.waitingPlayers.some((queuedSocket) => {
			return this.resolveUserId(queuedSocket) === clientUserId;
		});

		if (alreadyQueuedForUser) {
			this.logger.warn(`User ${clientUserId} (${authClient.user.username}) is already queued, rejecting duplicate`);
			client.emit('matchmakingError', {
				message: 'This account is already queued for PvP in another tab. Only one active queue per account.',
			});
			return;
		}

		this.waitingPlayers.push(client);

		if (this.waitingPlayers.length >= 2) {
			const player1Socket = this.waitingPlayers.shift()!;
			const player2Socket = this.waitingPlayers.shift()!;

			const gameId = this.nextGameId++;
			const roomName = `game-${gameId}`;

			// Cast sockets to AuthenticatedSocket to access user data
			const authPlayer1 = player1Socket as AuthenticatedSocket;
			const authPlayer2 = player2Socket as AuthenticatedSocket;
			const player1UserId = this.resolveUserId(player1Socket);
			const player2UserId = this.resolveUserId(player2Socket);

			if (player1UserId && player1UserId === player2UserId) {
				player1Socket.emit('matchmakingError', {
					message: 'Cannot start a PvP match with the same account.',
				});
				player2Socket.emit('matchmakingError', {
					message: 'Cannot start a PvP match with the same account.',
				});
				return;
			}

			this.logger.log(
				`🎯 Creating game ${gameId} with players ${authPlayer1.user.username} (${player1Socket.id}) and ${authPlayer2.user.username} (${player2Socket.id})`,
			);

			player1Socket.join(roomName);
			player2Socket.join(roomName);

			this.playerRooms.set(player1Socket.id, gameId);
			this.playerRooms.set(player2Socket.id, gameId);
			this.playerSides.set(player1Socket.id, 'left');
			this.playerSides.set(player2Socket.id, 'right');

			this.gameStartTimes.set(gameId, Date.now());

			// Create players with real user IDs and usernames from JWT
			const player1 = new Player(
				authPlayer1.user.id,        // ← Real user UUID from database
				player1Socket.id,           // ← Socket ID for internal tracking (rooms, sides)
				authPlayer1.user.username,  // ← Real username from JWT
				authPlayer1.user.email,     // ← Email (temporary, until we have profile pictures)
				0,                          // ← Rating (future feature)
			);
			const player2 = new Player(
				authPlayer2.user.id,
				player2Socket.id,
				authPlayer2.user.username,
				authPlayer2.user.email,
				0,
			);

			this.gameService.createGame(gameId, player1, player2, "");

			this.startGameBroadcast(gameId, roomName);

			player1Socket.emit('gameStarted', {
				gameId,
				message: 'Game started!',
				mode: 'pvp',
				side: 'left',
				leftUsername: authPlayer1.user.username,
				rightUsername: authPlayer2.user.username,
			});

			player2Socket.emit('gameStarted', {
				gameId,
				message: 'Game started!',
				mode: 'pvp',
				side: 'right',
				leftUsername: authPlayer1.user.username,
				rightUsername: authPlayer2.user.username,
			});
		} else {
			client.emit('waiting', {
				message: 'Waiting for opponent...',
			});
		}
	}

	@SubscribeMessage('cancelMatchmaking')
	handleCancelMatchmaking(@ConnectedSocket() client: Socket) {
		const authClient = client as AuthenticatedSocket;
		const clientUserId = this.resolveUserId(client);

		this.logger.log(`Client ${client.id} (${authClient.user.username}) cancelling matchmaking`);

		const wasWaiting = this.waitingPlayers.some((socket) => socket.id === client.id);

		if (wasWaiting) {
			this.waitingPlayers = this.waitingPlayers.filter((socket) => socket.id !== client.id);
			client.emit('matchmakingCancelled', {
				message: 'Matchmaking cancelled successfully.',
			});
			this.logger.log(`User ${clientUserId} (${authClient.user.username}) removed from matchmaking queue`);
		} else {
			client.emit('matchmakingError', {
				message: 'Not currently in matchmaking queue.',
			});
			this.logger.warn(`Cancel matchmaking requested by ${clientUserId} but not in queue`);
		}
	}

	@SubscribeMessage('playerMove')
	handlePlayerMove(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: PlayerMoveDto,
	) {
		const gameId = this.playerRooms.get(client.id);
		const side = this.playerSides.get(client.id);

		if (!gameId || !side) return;

		const game = this.gameService.getGame(gameId);
		if (!game) return;

		const input = new PlayerInput(data.direction);
		this.gameService.addInput(gameId, side, game.tick + 1, input);
	}

	@SubscribeMessage('latencyPing')
	handleLatencyPing(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { sentAt?: number },
	) {
		const sentAt =
			typeof data?.sentAt === 'number' && Number.isFinite(data.sentAt)
				? data.sentAt
				: Date.now();

		client.emit('latencyPong', {
			sentAt,
			serverAt: Date.now(),
		});
	}

	@SubscribeMessage('joinAIGame')
	handleJoinAIGame(
		@ConnectedSocket() client: Socket,
		@MessageBody(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) data: JoinAIGameDto) {
		if (!Object.values(AIDifficulty).includes(data.difficulty)) {
			client.emit('matchmakingError', {
				message: 'Invalid AI difficulty. Allowed values: easy, normal, hard.',
			});
			return;
		}

		this.logger.log(`Client ${client.id} wants to play against AI in ${data.difficulty} mode`);

		const gameId = this.nextGameId++;
		const roomName = `game-${gameId}`;

		// Cast socket to AuthenticatedSocket to access user data
		const authPlayer = client as AuthenticatedSocket;

		this.logger.log(
			`🎯 Creating AI game ${gameId} for player ${authPlayer.user.username} (${client.id})`,
		);

		client.join(roomName);

		this.playerRooms.set(client.id, gameId);
		this.playerSides.set(client.id, 'left');

		this.gameStartTimes.set(gameId, Date.now());

		const player = new Player(
			authPlayer.user.id,
			client.id,
			authPlayer.user.username,
			authPlayer.user.email,
			0,
		);
		const aiPlayer = new Player(
			'AI',
			'AI',
			'AI',
			'',
			0,
		);

		this.gameService.createGame(gameId, player, aiPlayer, data.difficulty);

		this.startGameBroadcast(gameId, roomName);

		client.emit('gameStarted', {
			gameId,
			message: 'Game against AI started!',
			mode: 'ai',
			side: 'left',
			leftUsername: authPlayer.user.username,
			rightUsername: 'AI',
		});
	}
	

	private startGameBroadcast(gameId: number, roomName: string) {
		const interval = setInterval(() => {
			const game = this.gameService.getGame(gameId);

			if (!game) {
				clearInterval(interval);
				this.gameIntervals.delete(gameId);
				return;
			}

		// Skip broadcasting and updates while paused
		if (game.status === 'paused') {
			return;
		}
		if (game.status === 'finished') {
			clearInterval(interval);
			this.gameIntervals.delete(gameId);

			const winnerSide: 'left' | 'right' =
				game.score.left >= game.score.right ? 'left' : 'right';
			const winnerUsername = game.players[winnerSide].username;

			const startTime = this.gameStartTimes.get(gameId) || Date.now();
			const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
				this.matchService.createFromGame(game, durationSeconds)
					.then((result) => {
						this.logger.log(`Match ${result.match.id} recorded successfully`);

						const playersInGame = Array.from(this.playerRooms.entries()).filter(([, mappedGameId]) => mappedGameId === gameId);

						if (playersInGame.length === 0) {
							this.server.to(roomName).emit('gameOver', {
								winner: winnerSide,
								winnerUsername,
								score: game.score,
								matchId: result.match.id,
								unlockedAchievements: [],
							});
						}

						for (const [socketId] of playersInGame) {
							const userId = this.getUserFromSocket(socketId);
							const unlockedAchievements = userId
								? (result.unlockedAchievementsByUserId[userId] ?? [])
								: [];

							this.server.to(socketId).emit('gameOver', {
								winner: winnerSide,
								winnerUsername,
								score: game.score,
								matchId: result.match.id,
								unlockedAchievements,
							});
						}
					})
					.catch((err) => {
						this.logger.error(
							'Failed to save match',
							err instanceof Error ? err.stack : String(err),
						);

						this.server.to(roomName).emit('gameOver', {
							winner: winnerSide,
							winnerUsername,
							score: game.score,
						});
					})
					.finally(() => {
						for (const [socketId, mappedGameId] of this.playerRooms.entries()) {
							if (mappedGameId === gameId) {
								this.playerRooms.delete(socketId);
								this.playerSides.delete(socketId);
							}
						}
						this.gameService.removeGame(gameId);
						this.gameStartTimes.delete(gameId);
						this.logger.log(`Game ${gameId} cleaned up after completion`);
					});

				return;
			}

			this.server.to(roomName).emit('gameState', {
				ball: game.ball,
				leftPaddle: game.paddle.left,
				rightPaddle: game.paddle.right,
				score: game.score,
				leftUsername: game.players.left.username,
				rightUsername: game.players.right.username,
				tick: game.tick,
			});
		}, 16,7);

		this.gameIntervals.set(gameId, interval);
	}
}
