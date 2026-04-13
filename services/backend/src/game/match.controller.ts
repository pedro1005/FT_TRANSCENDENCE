import {
	Controller,
	Get,
	Param,
	Query,
	UseGuards,
	Request,
	ParseIntPipe,
	DefaultValuePipe,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@Controller('api/matches')
@UseGuards(JwtAuthGuard) // Applies to all routes in this controller
export class MatchController {
	constructor(private matchService: MatchService) {}

	// Get current's user match history
	// GET /api/matches/me
	@Get('me')
	async getMyMatches(
		@Request() req,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
	) {
		const userId = req.user.id;
		return this.matchService.findByUserIdPaginated(userId, page, limit);
	}

	// Get current user's stats
	// GET /api/matches/me/stats
	@Get('me/stats')
	async getMyStats(@Request() req) {
		const userId = req.user.id;
		return this.matchService.getUserStats(userId);
	}

	// Get specific user's match history
	// GET /api/matches/user/:id
	@Get('user/:id')
	async getUserMatches(
		@Param('id') userId: string,
		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
		@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
	) {
		return this.matchService.findByUserIdPaginated(userId, page, limit);
	}

	// Get specific user's stats
	// GET /api/matches/user/:id/stats
	@Get('user/:id/stats')
	async getUserStats(@Param('id') userId: string) {
		return this.matchService.getUserStats(userId);
	}
}