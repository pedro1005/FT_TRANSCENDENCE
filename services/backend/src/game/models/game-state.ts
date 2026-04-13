import { SCORE_DEFAULTS, PADDLE_DEFAULTS } from "./../engine/constants";
import { Ball } from "./ball";
import { Paddle } from "./paddle";
import { Player } from "./player";
import { PlayerInput } from "./player-input";

export class GameState
{
	id:				number;
	status:			'running' | 'paused' | 'finished';
	difficulty:		'easy' | 'normal' | 'hard';

	inputQueue:	{ left: Map<number, PlayerInput>, right: Map<number, PlayerInput>};
	lastInput:	{ left: PlayerInput, right: PlayerInput};

	ball:		Ball;

	paddle:		{ left: Paddle, right: Paddle };
	players:	{ left: Player, right: Player };
	score:		{ left: number, right: number };

	tick:		number;

	constructor(id: number, players: {left: Player, right: Player}, 
	difficulty: string, tick: number)
	{
		this.id = id;
		this.status = 'running';
		if (difficulty === 'easy' || difficulty === 'normal' ||
		difficulty === 'hard')
			this.difficulty = difficulty;
		else
			this.difficulty = 'normal';
		this.inputQueue = { left: new Map(), right: new Map() };
		this.lastInput = { left: new PlayerInput('stop'), right: new PlayerInput('stop')};
		this.ball = new Ball();
		this.paddle = { left: new Paddle(PADDLE_DEFAULTS.position.lx),
		right: new Paddle(PADDLE_DEFAULTS.position.rx) };
		this.players = players;
		this.score = { left: SCORE_DEFAULTS.left, right: SCORE_DEFAULTS.right};
		this.tick = tick;
	}

	tick_increment()
	{
		this.tick++;
	}
}
