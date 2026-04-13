import { GameService } from './game.service';
import { Player } from './models/player';
import { PlayerInput } from './models/player-input';

function createPlayers() {
  return {
    left: new Player('left', 'left-socket', 'left', '', 0),
    right: new Player('right', 'right-socket', 'right', '', 0),
  };
}

describe('GameService', () => {
  it('creates and retrieves games', () => {
    const service = new GameService();
    const players = createPlayers();

    const game = service.createGame(42, players.left, players.right);
    const found = service.getGame(42);

    expect(found).toBeDefined();
    expect(found).toBe(game);
    expect(found?.players.left.id).toBe('left');
    expect(found?.players.right.id).toBe('right');
  });

  it('queues player input by side and tick', () => {
    const service = new GameService();
    const players = createPlayers();
    service.createGame(7, players.left, players.right);

    service.addInput(7, 'left', 10, new PlayerInput('up'));
    service.addInput(7, 'right', 11, new PlayerInput('down'));

    const game = service.getGame(7);
    expect(game?.inputQueue.left.get(10)?.direction).toBe('up');
    expect(game?.inputQueue.right.get(11)?.direction).toBe('down');
  });

  it('removes games cleanly', () => {
    const service = new GameService();
    const players = createPlayers();
    service.createGame(100, players.left, players.right);

    service.removeGame(100);

    expect(service.getGame(100)).toBeUndefined();
  });
});
