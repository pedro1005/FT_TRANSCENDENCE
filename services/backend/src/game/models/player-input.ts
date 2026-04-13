export class PlayerInput
{
	direction:		'up' | 'down' | 'stop' | 'pause' | 'resume';

	constructor(direction: 'up' | 'down' | 'stop' | 'pause' | 'resume')
	{
		this.direction = direction;
	}
}
