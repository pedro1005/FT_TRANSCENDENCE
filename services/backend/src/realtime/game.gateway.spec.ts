import { GameGateway } from './game.gateway';

type FakeSocket = {
  id: string;
  join: jest.Mock;
  emit: jest.Mock;
};

function createSocket(id: string): FakeSocket {
  return {
    id,
    join: jest.fn(),
    emit: jest.fn(),
  };
}

function createMockGameService() {
  const games = new Map<number, any>();

  return {
    createGame: jest.fn((id: number) => {
      const game = {
        id,
        status: 'running',
        score: { left: 0, right: 0 },
        ball: { position: { x: 0, y: 0 }, velocity: { x: 400, y: 0 } },
        paddle: {
          left: { position: { x: -470, y: 0 } },
          right: { position: { x: 470, y: 0 } },
        },
        players: {
          left: { id: 'c1', username: 'Player 1' },
          right: { id: 'c2', username: 'Player 2' },
        },
        tick: 0,
      };
      games.set(id, game);
      return game;
    }),
    getGame: jest.fn((id: number) => games.get(id)),
    removeGame: jest.fn((id: number) => {
      games.delete(id);
    }),
    addInput: jest.fn(),
    __games: games,
  };
}

function createMockMatchService() {
  return {
    createFromGame: jest.fn().mockResolvedValue({ id: 'match-1' }),
    createAbandoned: jest.fn().mockResolvedValue({ id: 'match-abandoned' }),
  };
}

describe('GameGateway', () => {
  let gateway: GameGateway;
  let gameService: ReturnType<typeof createMockGameService>;
  let matchService: ReturnType<typeof createMockMatchService>;
  let emitToRoom: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    gameService = createMockGameService();
    matchService = createMockMatchService();
    gateway = new GameGateway(gameService as any, matchService as any);

    emitToRoom = jest.fn();
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: emitToRoom }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('puts first player in waiting state', () => {
    const client1 = createSocket('c1');

    gateway.handleJoinGame(client1 as any);

    expect(client1.emit).toHaveBeenCalledWith('waiting', {
      message: 'Waiting for opponent...',
    });
  });

  it('pairs two players and starts a game room', () => {
    const client1 = createSocket('c1');
    const client2 = createSocket('c2');

    gateway.handleJoinGame(client1 as any);
    gateway.handleJoinGame(client2 as any);

    expect(gameService.createGame).toHaveBeenCalledTimes(1);
    expect(client1.join).toHaveBeenCalledWith('game-1');
    expect(client2.join).toHaveBeenCalledWith('game-1');
    expect(emitToRoom).toHaveBeenCalledWith(
      'gameStarted',
      expect.objectContaining({ gameId: 1 }),
    );
  });

  it('queues player movement using side mapping and tick + 1', () => {
    const client1 = createSocket('c1');
    const client2 = createSocket('c2');

    gateway.handleJoinGame(client1 as any);
    gateway.handleJoinGame(client2 as any);

    gateway.handlePlayerMove(client1 as any, { direction: 'up' } as any);

    expect(gameService.addInput).toHaveBeenCalledWith(
      1,
      'left',
      1,
      expect.objectContaining({ direction: 'up' }),
    );
  });

  it('broadcasts gameState while game is running', () => {
    const client1 = createSocket('c1');
    const client2 = createSocket('c2');

    gateway.handleJoinGame(client1 as any);
    gateway.handleJoinGame(client2 as any);

    jest.advanceTimersByTime(20);

    expect(emitToRoom).toHaveBeenCalledWith(
      'gameState',
      expect.objectContaining({ score: { left: 0, right: 0 }, tick: 0 }),
    );
  });

  // Legacy test skipped - functionality is covered by e2e tests
  it.skip('broadcasts gameOver when a game reaches finished state', () => {
    const client1 = createSocket('c1');
    const client2 = createSocket('c2');

    gateway.handleJoinGame(client1 as any);
    gateway.handleJoinGame(client2 as any);

    emitToRoom.mockClear();

    const runningGame = gameService.__games.get(1);
    runningGame.status = 'finished';
    runningGame.score = { left: 11, right: 5 };

    jest.advanceTimersByTime(20);

    expect(emitToRoom).toHaveBeenCalledWith('gameOver', expect.objectContaining({
      winner: 'left',
      score: { left: 11, right: 5 },
    }));
  });

  it('cleans up and notifies when a player disconnects mid-game', () => {
    const client1 = createSocket('c1');
    const client2 = createSocket('c2');

    gateway.handleJoinGame(client1 as any);
    gateway.handleJoinGame(client2 as any);

    gateway.handleDisconnect(client1 as any);

    expect(gameService.removeGame).toHaveBeenCalledWith(1);
    expect(emitToRoom).toHaveBeenCalledWith('gameOver', {
      message: 'opponentDisconnected',
    });
  });
});
