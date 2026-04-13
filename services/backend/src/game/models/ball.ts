import { BALL_DEFAULTS } from "./../engine/constants";

export class Ball
{
	radius:		number;
	position:	{ x: number, y: number };
	velocity:	{ x: number, y: number, increase: number, vmin: number, vmax: number};
	service:	number;

	constructor()
	{
		this.radius = BALL_DEFAULTS.radius;
		this.position = { ...BALL_DEFAULTS.position };
		this.velocity = { ...BALL_DEFAULTS.velocity };
		this.service = 1;
	}

	reset()
	{
    	this.radius =	BALL_DEFAULTS.radius;
		this.position =	{ ...BALL_DEFAULTS.position };
		this.velocity =	{ ...BALL_DEFAULTS.velocity };
		this.service = -this.service;
		this.velocity.x = this.service * this.velocity.x;
	}
}
