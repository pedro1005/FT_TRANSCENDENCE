import {
	IsString,
	IsInt,
	Min,
	Max,
	IsEnum,
	IsOptional
} from 'class-validator';
import { MatchStatus } from '@prisma/client';

export class CreateMatchDto {
	@IsString()
	player1Id: string;

	@IsString()
	player2Id: string;

	@IsInt()
	@Min(0)
	@Max(7)
	score1: number;

	@IsInt()
	@Min(0)
	@Max(7)
	score2: number;

	@IsString()
	@IsOptional()
	winnerId?: string; // Optional, can be null for a draw

	@IsInt()
	@Min(0)
	duration: number; // Duration in seconds

	@IsString()
	@IsOptional()
	tournamentId?: string; // Optional, if this match is part of a tournament

	@IsEnum(MatchStatus)
	@IsOptional()
	status: MatchStatus; // e.g., IN_PROGRESS, COMPLETED, CANCELED
}