import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameState } from './models/game-state';
import { MatchStatus } from '@prisma/client';
import { CreateMatchDto } from './dto/create-match-dto';
import { AI_USER_ID } from './ai/ai-user.constants';
import { AchievementsService } from '../achievements/achievements.service';
import { UnlockedAchievementSummary } from '../achievements/achievements.service';

interface CreateFromGameResult {
  match: {
    id: string;
  };
  unlockedAchievementsByUserId: Record<string, UnlockedAchievementSummary[]>;
}

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    private prisma: PrismaService,
    private achievementsService: AchievementsService,
  ) {}

  async createFromGame(game: GameState, durationSeconds: number): Promise<CreateFromGameResult> {
    const winnerId = game.score.left > game.score.right ? game.players.left.id : game.players.right.id;

    // Determine game mode and map AI player ID to database AI user
    const isAIGame = game.players.left.id === 'AI' || game.players.right.id === 'AI';
    const gameMode = isAIGame ? 'AI' : 'PVP';

    // Map player IDs: if player is AI, use the database AI user ID
    const player1Id = game.players.left.id === 'AI' ? AI_USER_ID : game.players.left.id;
    const player2Id = game.players.right.id === 'AI' ? AI_USER_ID : game.players.right.id;
    const finalWinnerId = winnerId === 'AI' ? AI_USER_ID : winnerId;

    const match = await this.prisma.match.create({
      data: {
        player1Id: player1Id,
        player2Id: player2Id,
        score1: game.score.left,
        score2: game.score.right,
        winnerId: finalWinnerId,
        duration: durationSeconds,
        status: MatchStatus.COMPLETED,
        gameMode: gameMode,
      },
      include: {
        player1: {
          select: { id: true, username: true, email: true },
        },
        player2: {
          select: { id: true, username: true, email: true },
        },
        winner: {
          select: { id: true, username: true },
        },
      },
    });

    this.logger.log(`Match ${match.id} saved: ${game.players.left.username} (${game.score.left}) vs ${game.players.right.username} (${game.score.right})`);

    const unlockedAchievementsByUserId: Record<string, UnlockedAchievementSummary[]> = {};

    try {
      unlockedAchievementsByUserId[player1Id] = await this.achievementsService.checkAndUnlock(player1Id);
    } catch (error) {
      this.logger.error(
        'Failed to unlock achievements for player1',
        error instanceof Error ? error.stack : String(error),
      );
      unlockedAchievementsByUserId[player1Id] = [];
    }

    if (player2Id !== AI_USER_ID) {
      try {
        unlockedAchievementsByUserId[player2Id] = await this.achievementsService.checkAndUnlock(player2Id);
      } catch (error) {
        this.logger.error(
          'Failed to unlock achievements for player2',
          error instanceof Error ? error.stack : String(error),
        );
        unlockedAchievementsByUserId[player2Id] = [];
      }
    } else {
      unlockedAchievementsByUserId[player2Id] = [];
    }

    return {
      match: {
        id: match.id,
      },
      unlockedAchievementsByUserId,
    };
  }

  async createAbandoned(
    player1Id: string,
    player2Id: string,
    score1: number,
    score2: number,
    durationSeconds: number,
    player1Username: string,
    player2Username: string,
    quitterId: string,
  ) {

    const isAIGame = player1Id === 'AI' || player2Id === 'AI';
    const gameMode = isAIGame ? 'AI' : 'PVP';

    const finalPlayer1Id = player1Id === 'AI' ? AI_USER_ID : player1Id;
    const finalPlayer2Id = player2Id === 'AI' ? AI_USER_ID : player2Id;
    const finalQuitterId = quitterId === 'AI' ? AI_USER_ID : quitterId;
    const finalWinnerId = finalQuitterId === finalPlayer1Id ? finalPlayer2Id : finalPlayer1Id;
    const match = await this.prisma.match.create({
      data: {
        player1Id: finalPlayer1Id,
        player2Id: finalPlayer2Id,
        score1,
        score2,
        winnerId: finalWinnerId,
        duration: durationSeconds,
        status: MatchStatus.ABANDONED,
        gameMode: gameMode,
	abandonedBy: finalQuitterId,
      },
    });

    this.logger.log(`Abandoned match ${match.id} saved: ${player1Username} (${score1}) vs ${player2Username} (${score2})`);

    return match;
  }

  async create(createMatchDto: CreateMatchDto) {
    return this.prisma.match.create({
      data: createMatchDto,
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      select: {
        id: true,
        createdAt: true,
        score1: true,
        score2: true,
        status: true,
	abandonedBy: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
        winner: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserStats(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: [MatchStatus.COMPLETED, MatchStatus.ABANDONED] },
      },
    });

    const wins = matches.filter((m) => m.winnerId === userId).length;
    const losses = matches.filter((m) => m.winnerId && m.winnerId !== userId).length;
    const total = matches.length;
    
    // Calculate total XP: 10 for win, 3 for loss
    const totalXp = wins * 10 + losses * 3;
    
    // Calculate level from total XP
    let level = 1;
    let xpThreshold = 30;
    let currentLevelXp = 0;
    
    while (currentLevelXp + xpThreshold <= totalXp) {
      currentLevelXp += xpThreshold;
      level += 1;
      xpThreshold += 10;
    }

    return {
      totalMatches: total,
      wins,
      losses,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      level,
    };
  }

  async findByUserIdPaginated(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
        select: {
          id: true,
          createdAt: true,
          score1: true,
          score2: true,
          status: true,
	  abandonedBy: true,
          player1: { select: { id: true, username: true, email: true } },
          player2: { select: { id: true, username: true, email: true } },
          winner: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.match.count({
        where: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
      }),
    ]);

    return {
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}
