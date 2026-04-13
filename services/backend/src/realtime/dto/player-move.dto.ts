import { IsEnum, IsNotEmpty } from 'class-validator';

export enum MoveDirection {
	UP = 'up',
	DOWN = 'down',
	STOP = 'stop',
}

export class PlayerMoveDto {
	@IsNotEmpty()
	@IsEnum(MoveDirection, {
		message: 'Direction must be "up", "down", or "stop"',
	})
	direction: MoveDirection;
}