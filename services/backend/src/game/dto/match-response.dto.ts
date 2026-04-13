import { Match, MatchStatus } from '@prisma/client';

export type MatchWithPlayers = Match & {
	player1: {
		id: string;
		username: string;
		email: string;
	};
	player2: {
		id: string;
		username: string;
		email: string;
	};
	winner?: {
		id: string;
		username: string;
	} | null;
};

// Clean response without sensitive data
export class MatchResponseDto {
	id: string;
	createdAt: Date;
	player1: {
		id: string;
		username: string;
	};
	player2: {
		id: string;
		username: string;
	};
	score1: number;
	score2: number;
	winner?: {
		id: string;
		username: string;
	} | null;
	duration: number;
	status: MatchStatus;

	// eli5: This static method takes a MatchWithPlayers object (which includes all the match details along with player info) and transforms it into a MatchResponseDto. It extracts only the necessary fields and formats them in a way that's safe to send back to clients, ensuring that no sensitive information (like player emails) is included in the response.
	// A static method is: a method that belongs to the class itself rather than an instance of the class. You can call it directly on the class without needing to create an object first. In this case, you can call MatchResponseDto.fromMatch(match) to convert a MatchWithPlayers object into a MatchResponseDto.

	// Transforms database result to cleanAPI response
	// Removes sensitive fields
	// Makes controller code cleaner
	static fromMatch(match: MatchWithPlayers): MatchResponseDto {
		return {
			id: match.id,
			createdAt: match.createdAt,
			player1: {
				id: match.player1.id,
				username: match.player1.username,
			},
			player2: {
				id: match.player2.id,
				username: match.player2.username,
			},
			score1: match.score1,
			score2: match.score2,
			winner: match.winner ? {
				id: match.winner.id,
				username: match.winner.username,
			} : null, // if match.winner is not null, return the object with id and username, otherwise return null
			duration: match.duration,
			status: match.status,
		};
	}
}