export const AI_USER_ID = '00000000-0000-0000-0000-000000000000';
export const AI_USER_EMAIL = 'ai@transcendence.local';
export const AI_USER_USERNAME = 'AI';

// Static bcrypt hash for a disabled/system account password.
export const AI_USER_PASSWORD_HASH = '$2b$10$7EqJtq98hPqEX7fNZaFWoOHi7x7sRKqGZo4PMBVXgS5aXoaZySUdk';

export const AI_EASY_DEFAULTS =
{
	reaction: 			0.65,
	aimJitter:			10,
	returnChance: 		0.5,
	deadzone:			20

} as const

export const AI_NORMAL_DEFAULTS =
{
	reaction: 			0.8,
	aimJitter:			2,
	returnChance: 		0.2,
	deadzone:			25

} as const

export const AI_HARD_DEFAULTS =
{
	reaction: 			0.98,
	aimJitter:			1,
	returnChance: 		0.10,
	deadzone:			30

} as const

export const AI_DEFAULTS =
{
  easy: 				AI_EASY_DEFAULTS,
  normal: 				AI_NORMAL_DEFAULTS,
  hard: 				AI_HARD_DEFAULTS

} as const;
