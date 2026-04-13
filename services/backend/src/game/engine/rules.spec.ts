import { checkEndGame, updateScore } from './rules';
import { SCORE_DEFAULTS, WORLD_DEFAULTS } from './constants';
import { GameState } from '../models/game-state';
import { Player } from '../models/player';

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

describe('rules', () => {
  it('awards left player when ball crosses right edge and resets ball', () => {
    const game = createGameState();

    game.ball.position.x = WORLD_DEFAULTS.width / 2 + game.ball.radius + 1;
    updateScore(game);

    expect(game.score.left).toBe(1);
    expect(game.score.right).toBe(0);
    expect(game.ball.position.x).toBe(0);
    expect(game.ball.position.y).toBe(0);
    expect(game.ball.velocity.x).toBeLessThan(0);
  });

  it('awards right player when ball crosses left edge and resets ball', () => {
    const game = createGameState();

    game.ball.position.x = -WORLD_DEFAULTS.width / 2 - game.ball.radius - 1;
    updateScore(game);

    expect(game.score.right).toBe(1);
    expect(game.score.left).toBe(0);
    expect(game.ball.position.x).toBe(0);
    expect(game.ball.position.y).toBe(0);
    expect(Math.abs(game.ball.velocity.x)).toBeGreaterThan(0);
  });

  it('marks game as finished at max score only', () => {
    const game = createGameState();

    game.score.left = SCORE_DEFAULTS.max - 1;
    checkEndGame(game);
    expect(game.status).toBe('running');

    game.score.left = SCORE_DEFAULTS.max;
    checkEndGame(game);
    expect(game.status).toBe('finished');
  });
});
