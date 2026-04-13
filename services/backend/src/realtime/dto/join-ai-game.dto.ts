import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AIDifficulty {
	EASY = 'easy',
	NORMAL = 'normal',
	HARD = 'hard',
}

export class JoinAIGameDto {
	@IsNotEmpty()
	@IsEnum(AIDifficulty, {
		message: 'Difficulty must be "easy", "normal", or "hard"',
	})
	difficulty: AIDifficulty;
}