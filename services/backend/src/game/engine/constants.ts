export const GAME_DEFAULTS = 
{
	delta:				0.0167 // 60Hz (1/60)

} as const;

export const WORLD_DEFAULTS = 
{
	width:				1000,
	height:				600

} as const;

export const SCORE_DEFAULTS = 
{
	left:				0,
	right:				0,
	max:				7

} as const;

export const BALL_DEFAULTS =
{
	radius:				10,
	position: 			{ x: 0, y: 0 },
	velocity: 			{ x: 400, y: 0, increase: 25, vmin: 1, vmax: 800},

} as const

export const PADDLE_DEFAULTS =
{
	width:				10,
	height:				120,
	position: 			{ lx: -470, rx: 470, y: 0, 
						ymax: WORLD_DEFAULTS.height / 2 },
	velocity: 			400

} as const
