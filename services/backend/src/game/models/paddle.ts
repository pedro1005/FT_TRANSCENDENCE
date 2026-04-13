import { PADDLE_DEFAULTS } from "./../engine/constants";

export class Paddle
{
	width:		number;
	height:		number;
	position:	{ x: number, y: number };
	velocity:	number;

	constructor(x: number)
	{
		this.width = PADDLE_DEFAULTS.width;
		this.height = PADDLE_DEFAULTS.height;
		this.position = { x: x, y: PADDLE_DEFAULTS.position.y};
		this.velocity = PADDLE_DEFAULTS.velocity;
	}

}
