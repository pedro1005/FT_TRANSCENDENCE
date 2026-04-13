import { updateGame } from './physics';
import { WORLD_DEFAULTS } from './constants';
import { GameState } from '../models/game-state';
import { Player } from '../models/player';
import { PlayerInput } from '../models/player-input';

function createGameState(): GameState {
  return new GameState(
    1,
    {
      left: new Player('left', 'left-socket', 'left', '', 0),
      right: new Player('right', 'right-socket', 'right', '', 0),
    },
    0,
  );
}

describe('physics engine', () => {
  it('moves the ball every tick', () => {
    const game = createGameState();
    const previousX = game.ball.position.x;

    updateGame(game);

    expect(game.ball.position.x).toBeGreaterThan(previousX);
  });

  it('bounces the ball on top and bottom walls', () => {
    const game = createGameState();

    game.ball.position.y = WORLD_DEFAULTS.height / 2 - game.ball.radius + 1;
    game.ball.velocity.y = 200;
    updateGame(game);
    expect(game.ball.velocity.y).toBeLessThan(0);

    game.ball.position.y = -WORLD_DEFAULTS.height / 2 + game.ball.radius - 1;
    game.ball.velocity.y = -200;
    updateGame(game);
    expect(game.ball.velocity.y).toBeGreaterThan(0);
  });

  it('keeps paddles inside world bounds under sustained input', () => {
    const game = createGameState();

    game.lastInput.left = new PlayerInput('up');
    for (let i = 0; i < 300; i++) {
      updateGame(game);
    }

    const maxY = WORLD_DEFAULTS.height / 2 - game.paddle.left.height / 2;
    expect(game.paddle.left.position.y).toBeLessThanOrEqual(maxY);

    game.lastInput.left = new PlayerInput('down');
    for (let i = 0; i < 600; i++) {
      updateGame(game);
    }

    const minY = -WORLD_DEFAULTS.height / 2 + game.paddle.left.height / 2;
    expect(game.paddle.left.position.y).toBeGreaterThanOrEqual(minY);
  });

  it('bounces ball off left paddle', () => {
    const game = createGameState();
    const paddle = game.paddle.left;

    game.ball.position.x =
      paddle.position.x + paddle.width / 2 + game.ball.radius - 0.1;
    game.ball.position.y = paddle.position.y;
    game.ball.velocity.x = -240;
    game.ball.velocity.y = 0;

    updateGame(game);

    expect(game.ball.velocity.x).toBeGreaterThan(0);
  });

  it('bounces ball off right paddle', () => {
    const game = createGameState();
    const paddle = game.paddle.right;

    game.ball.position.x =
      paddle.position.x - paddle.width / 2 - game.ball.radius + 0.1;
    game.ball.position.y = paddle.position.y;
    game.ball.velocity.x = 240;
    game.ball.velocity.y = 0;

    updateGame(game);

    expect(game.ball.velocity.x).toBeLessThan(0);
  });
});
